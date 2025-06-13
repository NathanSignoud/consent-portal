import express, { Request, Response } from 'express';
import Patient from '../models/Patient';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

const router = express.Router();

// 📦 Configuration Multer pour upload PDF
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

// 📄 GET /api/patients
router.get('/', async (_: Request, res: Response) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 📄 GET /api/patients/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 📄 GET /api/patients/:patientId/pdf/:pdfId
router.get('/:patientId/pdf/:pdfId', async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    const pdf = patient?.pdfs?.find(p => p._id.toString() === req.params.pdfId);
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    res.json(pdf); // ou res.sendFile(...) si tu veux le fichier
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 📄 POST /api/patients
router.post('/', upload.array('pdfs'), async (req: Request, res: Response) => {
  try {
    const { name, age } = req.body;
    const pathologies = JSON.parse(req.body.pathologies || '[]');

    const pdfs = (req.files as Express.Multer.File[]).map((file) => ({
      _id: new mongoose.Types.ObjectId(),
      filename: file.originalname,
      path: file.filename,
    }));

    const patient = new Patient({ name, age, pathologies, pdfs });
    await patient.save();

    res.status(201).json(patient);
  } catch (error: any) {
    console.error('Erreur lors de la création du patient :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 📄 DELETE /api/patients/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Supprimer les fichiers du disque
    for (const file of patient.pdfs || []) {
      const filePath = path.join('uploads', file.path);
      fs.unlink(filePath, (err) => {
        if (err) console.warn(`Erreur suppression : ${filePath}`, err);
        else console.log(`Supprimé : ${filePath}`);
      });
    }

    res.status(200).json({ message: 'Patient and PDFs deleted successfully' });
  } catch (err: any) {
    console.error('DELETE error:', err);
    res.status(500).json({ message: 'Error deleting patient' });
  }
});

export default router;
