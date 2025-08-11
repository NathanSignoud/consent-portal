// routes/calendar.routes.ts
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import Task from '../models/Task';
import Patient2 from '../models/Patient2';

dotenv.config();
const router = express.Router();

/** Types ORS (on ne prend que ce qu'on utilise) */
type ORSRouteResponse = {
  routes?: Array<{
    summary?: {
      distance?: number; // mètres
      duration?: number; // secondes
    }
  }>;
};

type ORSMatrixResponse = {
  durations?: number[][];
  distances?: number[][];
};

/**
 * GET /calendar/day-visits?date=YYYY-MM-DD
 * Retourne les "stops" du jour (groupés par patient) à partir des Tasks,
 * avec adresse/coords du Patient2 et les actions (tasks) du jour.
 */
router.get('/day-visits', async (req, res) => {
  try {
    const dateStr = String(req.query.date || '').trim();
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ error: "Paramètre 'date' requis au format YYYY-MM-DD" });
    }

    // 1) Tasks du jour avec un patient lié
    const tasks = await Task.find({
      date: dateStr,
      patientId: { $exists: true, $ne: null }
    }).lean();

    if (!tasks.length) {
      return res.json({ date: dateStr, count: 0, stops: [] });
    }

    // 2) Récupérer les patients + coords
    const patientIds = [...new Set(tasks.map(t => String(t.patientId)))];
    const patients = await Patient2.find({
      _id: { $in: patientIds },
      'adresse.latitude': { $type: 'number' },
      'adresse.longitude': { $type: 'number' }
    }).lean();

    const byPatient: Record<string, any> = {};
    patients.forEach(p => { byPatient[String(p._id)] = p; });

    // 3) Construire les stops
    const stops = patientIds
      .map(pid => {
        const p = byPatient[pid];
        if (!p || !p.adresse || typeof p.adresse.latitude !== 'number' || typeof p.adresse.longitude !== 'number') {
          return null;
        }

        const tasksOfPatient = tasks.filter(t => String(t.patientId) === pid);

        return {
          patientId: pid,
          nom: p.nom,
          adresse: {
            rue: p.adresse.rue || '',
            codePostal: p.adresse.codePostal || '',
            ville: p.adresse.ville || '',
            complement: p.adresse.complement || ''
          },
          coords: [p.adresse.longitude, p.adresse.latitude] as [number, number], // [lon, lat]
          actions: tasksOfPatient.map(t => ({
            taskId: String(t._id),
            icnp: t.icnp,            // { id, axis, term, description }
            date: t.date,            // "YYYY-MM-DD"
            completed: !!t.completed,
            notes: t.notes ?? null
          }))
        };
      })
      .filter(Boolean);

    return res.json({ date: dateStr, count: stops.length, stops });
  } catch (e: any) {
    console.error('[day-visits] error:', e);
    return res.status(500).json({ error: 'Erreur serveur', details: e?.message });
  }
});

/**
 * POST /calendar/travel-matrix
 * Body:
 *  - locations?: [ [lon,lat], ... ]  (>=2)
 *  - date?: "YYYY-MM-DD"            (si pas de locations, on dérive depuis Tasks du jour)
 *  - origin?: [lon,lat]              (point de départ optionnel, prépéndé s'il est valide)
 */
router.post('/travel-matrix', async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENROUTESERVICE_API_KEY absente' });

    let { locations, date, origin } = req.body as {
      locations?: [number, number][];
      date?: string;
      origin?: [number, number];
    };

    // Si pas de locations mais une date => calcul via Tasks + Patient2
    if ((!locations || !Array.isArray(locations) || locations.length < 2) && date) {
      const tasks = await Task.find({
        date,
        patientId: { $exists: true, $ne: null }
      }).lean();

      const patientIds = [...new Set(tasks.map(t => String(t.patientId)))];

      const patients = await Patient2.find({
        _id: { $in: patientIds },
        'adresse.latitude': { $type: 'number' },
        'adresse.longitude': { $type: 'number' }
      }).lean();

      locations = patients
        .filter(p => p.adresse && typeof p.adresse.latitude === 'number' && typeof p.adresse.longitude === 'number')
        .map(p => [p.adresse!.longitude, p.adresse!.latitude] as [number, number]);
    }

    // Validation
    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return res.status(400).json({
        error: "Fournir 'locations' (>=2) sous forme [[lon,lat], ...] ou un 'date' valide"
      });
    }

    // Ajouter origin en tête si fourni et numérique
    if (origin && Array.isArray(origin) && origin.length === 2) {
      const cand: [number, number] = [Number(origin[0]), Number(origin[1])];
      if (!Number.isNaN(cand[0]) && !Number.isNaN(cand[1])) {
        locations = [cand, ...locations];
      }
    }

    // Appel ORS Matrix
    const orsRes = await axios.post(
      'https://api.openrouteservice.org/v2/matrix/driving-car',
      {
        locations,                     // [[lon,lat], ...]
        metrics: ['distance', 'duration'],
        units: 'm'                     // distances en mètres
      },
      {
        headers: {
          Authorization: apiKey,       // (pas de "Bearer")
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );

    if (orsRes.status >= 400) {
      return res.status(orsRes.status).json({
        error: 'Erreur OpenRouteService',
        details: orsRes.data
      });
    }

    const data = orsRes.data as ORSMatrixResponse;
    if (!data?.durations || !data?.distances) {
      return res.status(502).json({ error: 'Réponse ORS inattendue', raw: data });
    }

    return res.json({
      count: locations.length,
      durations: data.durations, // secondes
      distances: data.distances  // mètres
    });
  } catch (e: any) {
    console.error('[travel-matrix] error:', e?.response?.data || e);
    return res.status(500).json({ error: 'Erreur serveur', details: e?.response?.data || e?.message });
  }
});

/**
 * POST /calendar/travel-time
 * Body: { from: [lon,lat], to: [lon,lat] }
 * -> temps et distance entre 2 points
 */
router.post('/travel-time', async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTESERVICE_API_KEY absente' });
    }

    let { from, to } = req.body as { from?: [number, number]; to?: [number, number] };

    if (!from || !to || !Array.isArray(from) || !Array.isArray(to) || from.length !== 2 || to.length !== 2) {
      return res.status(400).json({ error: "Coordonnées 'from' et 'to' requises sous forme [lon, lat]" });
    }

    from = [Number(from[0]), Number(from[1])];
    to   = [Number(to[0]), Number(to[1])];

    if ([...from, ...to].some((v) => Number.isNaN(v))) {
      return res.status(400).json({ error: 'Coordonnées non numériques' });
    }

    const orsRes = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      { coordinates: [from, to] },
      {
        headers: {
          Authorization: apiKey, // pas de "Bearer"
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (orsRes.status >= 400) {
      return res.status(orsRes.status).json({
        error: 'Erreur OpenRouteService',
        details: orsRes.data,
      });
    }

    const data = orsRes.data as ORSRouteResponse;
    const summary = data?.routes?.[0]?.summary;

    if (!summary || typeof summary.distance !== 'number' || typeof summary.duration !== 'number') {
      return res.status(502).json({ error: 'Réponse ORS inattendue', raw: data });
    }

    return res.json({
      distance_km: (summary.distance / 1000).toFixed(2),
      duration_min: Math.round(summary.duration / 60),
    });
  } catch (e: any) {
    console.error('[travel-time] error:', e?.response?.data || e);
    return res.status(500).json({ error: 'Erreur serveur', details: e?.response?.data || e?.message });
  }
});

export default router;