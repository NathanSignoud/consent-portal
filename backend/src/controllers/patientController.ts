import { Request, Response } from 'express';
import Patient from '../models/Patient';

interface PatientRequestBody {
  name: string;
  age: number;
  pathologies: string;
}

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, age, pathologies } = req.body as PatientRequestBody;

    const pdfPaths = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[]).map((file) => file.path)
      : [];

    const patient = new Patient({
      name,
      age,
      pathologies: JSON.parse(pathologies),
      pdfs: pdfPaths,
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur inconnue' });
    }
  }
};

export const getAllPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur inconnue' });
    }
  }
};
