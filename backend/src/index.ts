import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import Patient2Routes from './routes/patient2';

import { authMiddleware } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middlewares généraux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes publiques
app.use('/api/auth', authRoutes);
 
// Routes protégées (auth middleware)
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/patient2',authMiddleware, Patient2Routes);
// Middleware global de gestion des erreurs
app.use(errorHandler);

// Connexion à MongoDB et démarrage serveur
console.log('MONGO_URI:', process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI est manquant dans .env');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('Connecté à MongoDB');
    app.listen(PORT, () => {
      console.log(`Serveur lancé sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB :', err);
  });
