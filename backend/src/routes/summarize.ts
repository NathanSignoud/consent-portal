import express, { Request, Response } from 'express';
import axios from 'axios';

interface SummarizeResponse {
  summary: string;
}

const router = express.Router();

router.get('/:patientId/:pdfName', async (req: Request, res: Response) => {
  const { patientId, pdfName } = req.params;

  try {
    const response = await axios.get<SummarizeResponse>('http://localhost:5001/summarize', {
      params: { patientId, pdfName }
    });

    res.json({ summary: response.data.summary });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Erreur avec l’API Flask :', error.message);
    } else {
      console.error('Erreur inconnue avec l’API Flask');
    }
    res.status(500).json({
      error: 'Impossible de générer un résumé. Le service Flask est-il démarré ?'
    });
  }
});

export default router;
