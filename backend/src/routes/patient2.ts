/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response } from 'express';
import Patient2 from '../models/Patient2';
import multer from 'multer';
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
    sectionTitle: "Consentement à l'anesthésie",
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

// Helper function pour formater les actions selon le nouveau schéma
function formatAction(actionData: any, patientName: string = '') {
  return {
    // === Legacy (compatibilité) ===
    label: actionData.label || actionData.term?.fr || 'Action sans nom',
    status: actionData.status || 'à faire',
    date: actionData.date || null,

    // === Nouveau bloc ICNP normalisé ===
    icnp: {
      id: actionData.icnp?.id || null,
      axis: actionData.icnp?.axis || 'IC',
      term: {
        fr: actionData.icnp?.term?.fr || actionData.label || 'Action sans nom',
        en: actionData.icnp?.term?.en || null
      },
      description: {
        fr: actionData.icnp?.description?.fr || null,
        en: actionData.icnp?.description?.en || null
      }
    },

    // === Champs métier utiles côté UI ===
    patientName: patientName,
    notes: actionData.notes || null
  };
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
    console.log('📥 Données reçues:', req.body);
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

    // Formatage des actions selon le nouveau schéma ActionSchema
    const patientFullName = `${nom || ''} ${prenom || ''}`.trim();
    const formattedActions = Array.isArray(actions)
      ? actions.map((a: any) => formatAction(a, patientFullName))
      : [];

    // ========================================
    // CORRECTION PATHOLOGIES BACKEND
    // ========================================
    
    console.log("🔍 Pathologies reçues (type/valeur):", typeof pathologies, pathologies);
    
    let pathologiesArray: string[] = [];
    
    if (Array.isArray(pathologies)) {
      // Si c'est déjà un array (nouveau frontend corrigé)
      pathologiesArray = pathologies
        .filter(p => p && typeof p === 'string' && p.trim().length > 0)
        .map(p => p.trim());
      console.log("✅ Pathologies (array direct):", pathologiesArray);
    } else if (typeof pathologies === 'string' && pathologies.trim()) {
      // Si c'est encore une string (legacy ou erreur)
      pathologiesArray = pathologies
        .split('-')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
      console.log("✅ Pathologies (string divisée):", pathologiesArray);
    } else {
      console.log("📝 Aucune pathologie fournie");
    }

    // Validation des pathologies
    if (pathologiesArray.length > 0) {
      // Validation : pas plus de 20 pathologies
      if (pathologiesArray.length > 20) {
        return res.status(400).json({ 
          message: 'Trop de pathologies (maximum 20 autorisées)', 
          pathologies: pathologiesArray 
        });
      }
      
      // Validation : longueur de chaque pathologie
      const invalidPathologies = pathologiesArray.filter(p => p.length > 100);
      if (invalidPathologies.length > 0) {
        return res.status(400).json({ 
          message: 'Certaines pathologies sont trop longues (maximum 100 caractères)', 
          invalidPathologies 
        });
      }
    }

    let adresseFinale = adresse;

    // Géocodage automatique si adresse complète
    if (adresse && adresse.rue && adresse.codePostal && adresse.ville) {
      try {
        const coords = await geocodeAdresse(adresse);
        adresseFinale = {
          ...adresse,
          latitude: coords.latitude,
          longitude: coords.longitude
        };
        console.log(`🗺️ Adresse géocodée : ${adresse.rue}, ${adresse.ville} => lat: ${coords.latitude}, lon: ${coords.longitude}`);
      } catch (geocodeError) {
        console.warn("⚠️ Erreur géocodage:", geocodeError);
        // Continuer sans géocodage en cas d'erreur
        adresseFinale = adresse;
      }
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
      pathologies: pathologiesArray, // ← Array correctement formaté
      consents: Array.isArray(consents) ? consents : defaultConsents,
      adresse: adresseFinale
    });

    console.log("💾 Patient à sauvegarder:", {
      nom: patient.nom,
      prenom: patient.prenom,
      pathologies: patient.pathologies,
      pathologiesCount: patient.pathologies?.length || 0,
      actionsCount: patient.actions.length
    });

    await patient.save();
    
    console.log("✅ Patient sauvegardé avec succès");
    console.log("✅ Pathologies finales:", patient.pathologies);
    
    res.status(201).json(patient);
  } catch (error: any) {
    console.error('❌ Erreur lors de la création du patient2 :', error);
    
    // Gestion d'erreurs spécifiques
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        message: 'Erreur de validation des données',
        errors: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Un patient avec ces informations existe déjà',
        duplicateFields: Object.keys(error.keyPattern)
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création du patient', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
});

// ========================================
// ROUTE UPDATE CORRIGÉE AUSSI
// ========================================

// PUT update patient
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { actions, consents, adresse, pathologies } = req.body;

    const updateFields: any = {};
    
    // Formatage des actions si présentes
    if (Array.isArray(actions)) {
      const patient = await Patient2.findById(req.params.id);
      const patientName = patient ? `${patient.nom} ${patient.prenom}`.trim() : '';
      updateFields.actions = actions.map((a: any) => formatAction(a, patientName));
    }
    
    // Traitement des pathologies pour l'update aussi
    if (pathologies !== undefined) {
      let pathologiesArray: string[] = [];
      
      if (Array.isArray(pathologies)) {
        pathologiesArray = pathologies
          .filter(p => p && typeof p === 'string' && p.trim().length > 0)
          .map(p => p.trim());
      } else if (typeof pathologies === 'string' && pathologies.trim()) {
        pathologiesArray = pathologies
          .split('-')
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);
      }
      
      updateFields.pathologies = pathologiesArray;
      console.log("🔄 Update pathologies:", pathologiesArray);
    }

    // Traitement des consents
    if (Array.isArray(consents)) {
      updateFields.consents = consents.map((consent: any) => ({
        ...consent,
        validatedAt: consent.validatedAt || new Date()
      }));
    }

    // Traitement de l'adresse
    if (adresse) {
      let adresseFinale = adresse;
      
      // Géocodage si adresse complète
      if (adresse.rue && adresse.codePostal && adresse.ville) {
        try {
          const coords = await geocodeAdresse(adresse);
          adresseFinale = {
            ...adresse,
            latitude: coords.latitude,
            longitude: coords.longitude
          };
        } catch (geocodeError) {
          console.warn("⚠️ Erreur géocodage lors de l'update:", geocodeError);
          adresseFinale = adresse;
        }
      }
      
      updateFields.adresse = adresseFinale;
    }

    const updatedPatient = await Patient2.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    console.log("✅ Patient mis à jour:", {
      id: updatedPatient._id,
      pathologies: updatedPatient.pathologies
    });

    res.json(updatedPatient);
  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du patient2 :', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la mise à jour', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
});

// ========================================
// FONCTION UTILITAIRE POUR DEBUG
// ========================================

// Route de test pour vérifier le traitement des pathologies
router.post('/test-pathologies', async (req: Request, res: Response) => {
  try {
    const { pathologies } = req.body;
    
    console.log("🧪 Test pathologies - Input:", pathologies, typeof pathologies);
    
    let result: string[] = [];
    
    if (Array.isArray(pathologies)) {
      result = pathologies
        .filter(p => p && typeof p === 'string' && p.trim().length > 0)
        .map(p => p.trim());
    } else if (typeof pathologies === 'string' && pathologies.trim()) {
      result = pathologies
        .split('-')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
    }
    
    res.json({
      input: pathologies,
      inputType: typeof pathologies,
      output: result,
      outputCount: result.length,
      processed: result.map((p, i) => `${i + 1}. ${p}`).join(' | ')
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ROUTE DE DEBUG POUR VÉRIFIER UN PATIENT
// ========================================

router.get('/:id/debug', async (req: Request, res: Response) => {
  try {
    const patient = await Patient2.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    res.json({
      id: patient._id,
      nom: patient.nom,
      prenom: patient.prenom,
      pathologies: {
        value: patient.pathologies,
        type: typeof patient.pathologies,
        isArray: Array.isArray(patient.pathologies),
        count: patient.pathologies?.length || 0,
        items: patient.pathologies || []
      },
      actions: {
        count: patient.actions?.length || 0
      },
      adresse: patient.adresse,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

      const patientName = row["N. Ut."] || '';

      // Formatage des actions selon le nouveau schéma ActionSchema
      const actions = actionsRaw.map((action: string) => {
        const isDone = action.toLowerCase().includes("(réalisé)") || 
                       action.toLowerCase().includes("(annulé)") || 
                       action.toLowerCase().includes("(réalisé non prévu)");
        
        const cleanLabel = action.replace(/\s*(\(Prévu\)|\(Réalisé\)|\(Annulé\)|\(Réalisé non prévu\))/gi, '').trim();
        
        return {
          // === Legacy (compatibilité) ===
          label: cleanLabel,
          status: isDone ? "réalisé" : "à faire",
          date: null,

          // === Nouveau bloc ICNP (vide pour import legacy) ===
          icnp: {
            id: null, // Sera rempli plus tard si nécessaire
            axis: 'IC',
            term: {
              fr: cleanLabel,
              en: null
            },
            description: {
              fr: null,
              en: null
            }
          },

          // === Champs métier ===
          patientName: patientName,
          notes: null
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
    res.status(500).json({ message: 'Erreur lors de l\'importation.' });
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

// BONUS: Route pour migrer les anciennes actions vers le nouveau format ICNP
router.post('/migrate-actions', async (req: Request, res: Response) => {
  try {
    const patients = await Patient2.find({ 'actions.icnp.id': null });
    let migratedCount = 0;

    for (const patient of patients) {
      const patientName = `${patient.nom} ${patient.prenom}`.trim();
      let hasChanges = false;

      const updatedActions = patient.actions.map((action: any) => {
        if (!action.icnp || !action.icnp.id) {
          hasChanges = true;
          return formatAction(action, patientName);
        }
        return action;
      });

      if (hasChanges) {
        await Patient2.findByIdAndUpdate(patient._id, { actions: updatedActions });
        migratedCount++;
      }
    }

    res.json({ 
      message: `Migration terminée: ${migratedCount} patients mis à jour`,
      migratedCount 
    });
  } catch (err: any) {
    console.error('Erreur lors de la migration:', err);
    res.status(500).json({ message: 'Erreur lors de la migration' });
  }
});

export default router;