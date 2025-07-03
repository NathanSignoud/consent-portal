import express from 'express';
import Consent from '../models/Consent';

const router = express.Router();

// POST /api/consent
router.post('/', async (req, res) => {
  try {
    const { patientId, sectionTitle, answers, checkboxes } = req.body;

    const existing = await Consent.findOne({ patientId, sectionTitle });
    if (existing) {
      return res.status(409).json({ message: 'Consentement déjà enregistré.' });
    }

    const consent = new Consent({ patientId, sectionTitle, answers, checkboxes });
    await consent.save();

    res.status(201).json({ message: 'Consentement enregistré.', consent });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
});

// GET /api/consent/:patientId
router.get('/:patientId', async (req, res) => {
  try {
    const consents = await Consent.find({ patientId: req.params.patientId });
    res.json(consents);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
});

// PUT /api/consent/:patientId/:sectionTitle
router.put('/:patientId/:sectionTitle', async (req, res) => {
  try {
    const { patientId, sectionTitle } = req.params;
    const { answers, checkboxes } = req.body;

    const updated = await Consent.findOneAndUpdate(
      { patientId, sectionTitle },
      { answers, checkboxes, validatedAt: new Date() },
      { new: true, upsert: true } // upsert = crée si ça n'existe pas
    );

    res.json({ message: 'Consentement mis à jour.', consent: updated });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
});


export default router;