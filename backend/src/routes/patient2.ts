import express, { Request, Response } from 'express';
import Patient2 from '../models/Patient2';
import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Consentements par défaut
const defaultConsents = [
  {
    sectionTitle: "Consentement à l'intervention",
    answers: ["", "", ""],
    checkboxes: {
      understood: false,
      surgeryConsent: false,
      otherConsent: false
    },
    validatedAt: null
  },
  {
    sectionTitle: "Consentement à l’anesthésie",
    answers: ["", "", ""],
    checkboxes: {
      understood: false,
      surgeryConsent: false,
      otherConsent: false
    },
    validatedAt: null
  },
  {
    sectionTitle: "Consentement au partage des données",
    answers: ["", "", ""],
    checkboxes: {
      understood: false,
      surgeryConsent: false,
      otherConsent: false
    },
    validatedAt: null
  }
];

async function geocodeAdresse(adresse: {
  rue: string;
  codePostal: string;
  ville: string;
}): Promise<{ latitude: number | null; longitude: number | null }> {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const { rue, codePostal, ville } = adresse;

  if (!apiKey) {
    console.error("Clé API OpenCage manquante");
    return { latitude: null, longitude: null };
  }

  const query = `${rue}, ${codePostal} ${ville}`;

  try {
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: apiKey,
        q: query,
        language: 'fr',
        limit: 1
      }
    });

    const data = response.data as any;
    const results = data.results;
    if (results && results.length > 0) {
      return {
        latitude: results[0].geometry.lat,
        longitude: results[0].geometry.lng
      };
    }

    return { latitude: null, longitude: null };
  } catch (error) {
    console.error('Erreur lors du géocodage OpenCage :', error);
    return { latitude: null, longitude: null };
  }
}

// GET all patients
router.get('/', async (_: Request, res: Response) => {
  try {
    const patients = await Patient2.find();
    res.json(patients);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET patient by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await Patient2.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST new patient
router.post('/', upload.none(), async (req: Request, res: Response) => {
  try {
    console.log('Received data:', req.body);
    const {
      nom,
      prenom,
      dateNaissance,
      sexe,
      statutIdentite,
      uniteOrganisationnelle,
      ipp,
      situationDossier,
      dateDebutPriseEnCharge,
      dateSortieEffective,
      dateSortiePrevue,
      hopitalProvenance,
      actions,
      pathologies,
      consents,
      adresse
    } = req.body;

    const formattedActions = Array.isArray(actions)
      ? actions.map((a: any) => ({
          label: a.label,
          status: a.status || 'à faire',
          date: a.date || null
        }))
      : [];

    const pathologiesArray = typeof pathologies === 'string' && pathologies.trim() 
      ? pathologies.split('-').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
      : [];

    let adresseFinale = adresse;

    if (adresse && adresse.rue && adresse.codePostal && adresse.ville) {
      const coords = await geocodeAdresse(adresse);
      adresseFinale = {
        ...adresse,
        latitude: coords.latitude,
        longitude: coords.longitude
      };
      console.log(`Adresse géocodée : ${adresse.rue}, ${adresse.ville} => lat: ${coords.latitude}, lon: ${coords.longitude}`);
    }

    const patient = new Patient2({
      nom,
      prenom,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
      sexe,
      statutIdentite,
      uniteOrganisationnelle,
      ipp,
      situationDossier,
      dateDebutPriseEnCharge: dateDebutPriseEnCharge ? new Date(dateDebutPriseEnCharge) : undefined,
      dateSortieEffective: dateSortieEffective ? new Date(dateSortieEffective) : undefined,
      dateSortiePrevue: dateSortiePrevue ? new Date(dateSortiePrevue) : undefined,
      hopitalProvenance,
      actions: formattedActions,
      pathologies: pathologiesArray,
      consents: Array.isArray(consents) ? consents : defaultConsents,
      adresse: adresseFinale
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error: any) {
    console.error('Erreur lors de la création du patient2 :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// IMPORT patients from Excel
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Aucun fichier reçu.' });

    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    let count = 0;

    for (const row of data as any[]) {
      const existing = await Patient2.findOne({
        nom: row["N. Ut."],
        dateNaissance: new Date(row["DDN"])
      });
      if (existing) continue;

      const actionsRaw = typeof row["actions"] === "string"
        ? row["actions"].split("\n").map((a: string) => a.trim()).filter(Boolean)
        : [];

      const actions = actionsRaw.map((action: string) => {
        const isDone = action.toLowerCase().includes("(réalisé)") || action.toLowerCase().includes("(annulé)") || action.toLowerCase().includes("(réalisé non prévu)");
        return {
          label: action.replace(/\s*(\(Prévu\)|\(Réalisé\))/gi, '').trim(),
          status: isDone ? "réalisé" : "à faire",
          date: null
        };
      });

      const pathologies = typeof row["pathologies"] === "string"
        ? row["pathologies"].split("-").map((p: string) => p.trim()).filter(Boolean)
        : [];

      const patient = new Patient2({
        nom: row["N. Ut."],
        dateNaissance: row["DDN"] ? new Date(row["DDN"]) : null,
        sexe: row["S"],
        statutIdentite: row["Statut d'identité"],
        uniteOrganisationnelle: row["Unités Organisationnelles"],
        ipp: row["IPP"],
        situationDossier: row["Situation dossier/séjour"],
        dateDebutPriseEnCharge: row["Date de début de prise en charge"] ? new Date(row["Date de début de prise en charge"]) : null,
        dateSortieEffective: row["Date de sortie effective"] ? new Date(row["Date de sortie effective"]) : null,
        dateSortiePrevue: row["Date de sortie prévue"] ? new Date(row["Date de sortie prévue"]) : null,
        hopitalProvenance: row["Hôpital de provenance"] || null,
        actions,
        pathologies,
        consents: defaultConsents,
        adresse: {
          rue: '',
          codePostal: '',
          ville: '',
          complement: '',
          latitude: null,
          longitude: null
        }
      });

      await patient.save();
      count++;
    }

    fs.unlinkSync(file.path);
    res.status(201).json({ message: `${count} patients ajoutés.` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l’importation.' });
  }
});

// PUT update actions, consents, and address
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { actions, consents, adresse } = req.body;

    const updateFields: any = {};
    if (Array.isArray(actions)) updateFields.actions = actions;
    if (Array.isArray(consents)) updateFields.consents = consents;
    if (adresse) updateFields.adresse = adresse;

    const updatedPatient = await Patient2.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    res.json(updatedPatient);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du patient:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE patient
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await Patient2.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    res.status(200).json({ message: 'Patient supprimé avec succès' });
  } catch (err: any) {
    console.error('Erreur suppression:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

export default router;
