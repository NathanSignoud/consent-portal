import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Interface pour les réponses d'erreur standardisées
interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
  stack?: string;
}

// Types d'erreurs personnalisées
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Gestionnaire principal d'erreurs
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si la réponse a déjà été envoyée, déléguer à Express
  if (res.headersSent) {
    return next(err);
  }

  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  const method = req.method;

  // Log de l'erreur pour debugging
  console.error(`[ERROR] ${timestamp} - ${method} ${path}`);
  console.error('Error details:', err);

  let statusCode = 500;
  let message = 'Une erreur interne est survenue';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: any = undefined;

  // === Gestion des erreurs personnalisées ===
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }
  
  // === Erreurs de validation Mongoose ===
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Erreur de validation des données';
    
    // Extraire les détails de validation
    details = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
  }
  
  // === Erreur de duplication MongoDB (E11000) ===
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Cette ressource existe déjà';
    
    // Extraire le champ dupliqué
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    details = {
      field,
      value,
      message: `${field} '${value}' est déjà utilisé`
    };
  }
  
  // === Erreur CastError MongoDB (ID invalide) ===
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'ID invalide';
    details = {
      field: err.path,
      value: err.value,
      expectedType: err.kind
    };
  }
  
  // === Erreurs JWT ===
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Token d\'authentification invalide';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token d\'authentification expiré';
  }
  
  // === Erreurs de syntaxe JSON ===
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Format JSON invalide';
  }
  
  // === Erreurs de limite de taille ===
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    code = 'FILE_TOO_LARGE';
    message = 'Fichier trop volumineux';
    details = {
      maxSize: err.limit,
      receivedSize: err.received
    };
  }
  
  // === Erreurs de connexion base de données ===
  else if (err.name === 'MongoNetworkError') {
    statusCode = 503;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Erreur de connexion à la base de données';
  }
  
  // === Erreurs axios/réseau ===
  else if (err.isAxiosError) {
    statusCode = err.response?.status || 502;
    code = 'EXTERNAL_API_ERROR';
    message = 'Erreur lors de l\'appel à un service externe';
    details = {
      externalStatus: err.response?.status,
      externalMessage: err.response?.data?.message || err.message,
      url: err.config?.url
    };
  }
  
  // === Erreur 404 personnalisée ===
  else if (err.status === 404 || err.statusCode === 404) {
    statusCode = 404;
    code = 'RESOURCE_NOT_FOUND';
    message = 'Ressource non trouvée';
  }
  
  // === Erreur de permission ===
  else if (err.status === 403 || err.statusCode === 403) {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = 'Accès interdit';
  }
  
  // === Autres erreurs connues ===
  else if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
    message = err.message || message;
    code = err.code || code;
  }

  // Construction de la réponse d'erreur
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
    timestamp,
    path,
    method
  };

  // Ajouter les détails en développement ou si fournis
  if (details) {
    errorResponse.details = details;
  }

  // Ajouter la stack trace seulement en développement
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Log spécial pour les erreurs 5xx (erreurs serveur)
  if (statusCode >= 500) {
    console.error('=== ERREUR SERVEUR CRITIQUE ===');
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${message}`);
    console.error(`Path: ${method} ${path}`);
    console.error(`Stack: ${err.stack}`);
    console.error('=================================');
    
    // Ici vous pourriez ajouter des notifications (Slack, email, etc.)
    // await notifyErrorToSlack(err, req);
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware pour capturer les routes 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} introuvable`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Helper pour créer des erreurs personnalisées facilement
export const createError = (message: string, statusCode: number = 500, code?: string): AppError => {
  return new AppError(message, statusCode, code);
};

// Middleware d'erreur async pour éviter les try/catch partout
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};