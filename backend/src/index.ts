import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config();

// Import des routes
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import Patient2Routes from './routes/patient2';
import consentRoutes from './routes/consent';
import calendarRoutes from './routes/calendar.routes';
import tasksRoutes from './routes/tasks.routes';
import icnpRoutes from './routes/icnp.routes';

// Import des middlewares améliorés
import { authMiddleware, optionalAuth, requireRole } from './middlewares/auth';
import { errorHandler, notFoundHandler, AppError } from './middlewares/errorHandler';
import { validateRequest, validatePagination, validateObjectId } from './middlewares/validateRequest';

const app = express();
const PORT = process.env.PORT || 5000;

// Validation critique des variables d'environnement
const criticalEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingCriticalVars = criticalEnvVars.filter(varName => !process.env[varName]);

if (missingCriticalVars.length > 0) {
  console.error(`❌ Variables d'environnement critiques manquantes: ${missingCriticalVars.join(', ')}`);
  console.error('Le serveur ne peut pas démarrer sans ces variables.');
  process.exit(1);
}

// Middlewares de sécurité et configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parsing des données avec limites de sécurité
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  type: 'application/x-www-form-urlencoded'
}));

// Middleware de logging des requêtes (en développement)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });
}

// Headers de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Fichiers statiques sécurisés
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Seulement les images et PDFs
    if (filePath.match(/\.(jpg|jpeg|png|gif|pdf)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Route de santé étendue
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    }
  };
  
  // Status code selon l'état des services
  const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;
  res.status(statusCode).json(health);
});

// =================================
// ROUTES PUBLIQUES (pas d'auth)
// =================================

// Authentication routes (avec rate limiting intégré)
app.use('/api/auth', authRoutes);

// =================================
// ROUTES SEMI-PUBLIQUES 
// (auth optionnelle selon vos besoins)
// =================================

// ICNP - Peut être public pour l'autocomplétion
app.use('/api/icnp', icnpRoutes);

// Calendar - Selon votre logique métier (actuellement public)
app.use('/api/calendar', 
  // Optionnel: ajouter une validation des query params
  (req, res, next) => {
    if (req.query.date && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.date as string)) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide. Utilisez YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    next();
  },
  calendarRoutes
);

// Tasks - Avec validation basique
app.use('/api/tasks',
  // Validation des query params communs
  (req, res, next) => {
    if (req.method === 'GET') {
      return validateRequest({
        userId: { required: false, type: 'string' },
        date: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
        completed: { required: false, type: 'string', enum: ['true', 'false'] },
        patientId: { required: false, type: 'objectId' }
      }, 'query')(req, res, next);
    }
    next();
  },
  tasksRoutes
);

// =================================
// ROUTES PROTÉGÉES (auth obligatoire)
// =================================

// Routes patients avec auth
app.use('/api/patients', 
  authMiddleware,
  patientRoutes
);

// Routes patient2 avec auth
app.use('/api/patient2', 
  authMiddleware,
  Patient2Routes
);

// Routes consent avec auth et validation role
app.use('/api/consent', 
  authMiddleware,
  // Optionnel: restreindre aux rôles autorisés
  // requireRole(['nurse', 'doctor', 'admin']),
  consentRoutes
);

// =================================
// ROUTES SPÉCIALISÉES
// =================================

// Route PDF sécurisée avec validation
app.get('/pdf/:filename', 
  authMiddleware,
  validateRequest({
    filename: { 
      required: true, 
      type: 'string',
      pattern: /^[\w\-. ]+\.(pdf|PDF)$/,
      custom: (value: string) => {
        if (value.includes('..')) return 'Nom de fichier invalide: traversée de répertoire interdite';
        if (value.length > 255) return 'Nom de fichier trop long';
        return true;
      }
    }
  }, 'params'),
  (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    res.sendFile(filePath, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    }, (err) => {
      if (err) {
        console.error(`Erreur envoi PDF ${filename}:`, err);
        if (!res.headersSent) {
          res.status(404).json({ 
            success: false,
            error: 'Fichier PDF introuvable',
            code: 'PDF_NOT_FOUND'
          });
        }
      }
    });
  }
);

// =================================
// ROUTES ADMIN (si nécessaire)
// =================================

// Exemple de routes admin protégées
app.use('/api/admin', 
  authMiddleware,
  requireRole(['admin']),
  (req: any, res) => {
    res.json({ 
      message: 'Zone admin - fonctionnalités à implémenter',
      user: req.user
    });
  }
);

// =================================
// GESTION DES ERREURS
// =================================

// Middleware 404 pour toutes les routes non trouvées
app.use(notFoundHandler);

// Middleware global de gestion des erreurs (DOIT être en dernier)
app.use(errorHandler);

// =================================
// GESTION GRACIEUSE DU SERVEUR
// =================================

// Validation des variables d'environnement optionnelles
const optionalEnvVars = ['OPENCAGE_API_KEY', 'OPENROUTESERVICE_API_KEY'];
const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingOptionalVars.length > 0) {
  console.warn(`⚠️  Variables d'environnement optionnelles manquantes: ${missingOptionalVars.join(', ')}`);
  console.warn('Certaines fonctionnalités pourraient être limitées.');
}

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} reçu, arrêt gracieux du serveur...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ Connexion MongoDB fermée');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('🚨 Reason:', reason);
  
  // En production, envoyer vers un service de monitoring
  if (process.env.NODE_ENV === 'production') {
    // await notifyErrorService({ type: 'unhandledRejection', reason, promise });
    console.error('🚨 Arrêt du processus...');
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  
  if (process.env.NODE_ENV === 'production') {
    // await notifyErrorService({ type: 'uncaughtException', error });
  }
  
  console.error('🚨 Arrêt du processus...');
  process.exit(1);
});

// =================================
// CONNEXION MONGODB ET DÉMARRAGE
// =================================

const connectDB = async () => {
  try {
    console.log('🔄 Tentative de connexion à MongoDB...');
    
    // Masquer le mot de passe dans les logs
    const mongoUriForLog = process.env.MONGO_URI?.replace(/:[^:@]*@/, ':****@');
    console.log(`📍 MONGO_URI: ${mongoUriForLog}`);

    await mongoose.connect(process.env.MONGO_URI!, {
      // Options optimisées pour la production
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT || '5000'),
      socketTimeoutMS: 45000,
      // Retry automatique
      maxConnecting: 3,
      // Nom de l'application pour MongoDB
      appName: 'healthcare-app'
    });

    console.log('✅ Connecté à MongoDB');

    // Démarrage du serveur
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
        console.log(`👤 Auth: http://localhost:${PORT}/api/auth`);
        console.log(`🏥 Patients: http://localhost:${PORT}/api/patients`);
        console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
      }
      
      console.log('='.repeat(50) + '\n');
    });

    // Timeout pour les requêtes longues
    server.timeout = 30000; // 30 secondes

  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    
    if (process.env.NODE_ENV === 'production') {
      // En production, essayer de redémarrer après un délai
      console.log('🔄 Tentative de reconnexion dans 5 secondes...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Démarrage de l'application
connectDB();

export default app;