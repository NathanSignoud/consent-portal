import express, { Request, Response } from 'express';
import Patient2 from '../models/Patient2';
import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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
    const {
      nom,
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
      pathologies
    } = req.body;

    const formattedActions = Array.isArray(actions)
      ? actions.map((a: any) => ({
          label: a.label,
          status: a.status || 'à faire',
          date: a.date || null
        }))
      : [];

    const patient = new Patient2({
      nom,
      dateNaissance: new Date(dateNaissance),
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
      pathologies: pathologies?.split('-').map((p: string) => p.trim()).filter((p: string) => p),
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error: any) {
    console.error('Erreur lors de la création du patient2 :', error);
    res.status(500).json({ message: 'Erreur serveur' });
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
        const isDone = action.toLowerCase().includes("(réalisé)");
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
        pathologies
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

// PUT update actions of patient
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { actions } = req.body;

    if (!Array.isArray(actions) || !actions.every(a => a.label && typeof a.label === 'string')) {
      return res.status(400).json({ message: 'Format des actions invalide' });
    }

    const updatedPatient = await Patient2.findByIdAndUpdate(
      req.params.id,
      { actions },
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
