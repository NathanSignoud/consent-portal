import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: string;
  email?: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

interface CustomRequest extends ExpressRequest {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

// Types pour les réponses d'erreur standardisées
interface AuthErrorResponse {
  success: false;
  message: string;
  code: string;
  timestamp: string;
}

export const authMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // Vérification de la présence du header Authorization
    if (!authHeader) {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Header Authorization manquant',
        code: 'MISSING_AUTH_HEADER',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Vérification du format Bearer
    if (!authHeader.startsWith('Bearer ')) {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Format du token invalide. Utilisez: Bearer <token>',
        code: 'INVALID_TOKEN_FORMAT',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(errorResponse);
      return;
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    
    // Vérification que le token n'est pas vide
    if (!token || token.trim() === '') {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Token vide',
        code: 'EMPTY_TOKEN',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Vérification de la présence du secret JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET manquant dans les variables d\'environnement');
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Erreur de configuration du serveur',
        code: 'SERVER_CONFIG_ERROR',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(errorResponse);
      return;
    }

    // Décodage et vérification du token
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Vérification des champs requis dans le payload
    if (!decoded.userId || !decoded.role) {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Token invalide: données utilisateur manquantes',
        code: 'INVALID_TOKEN_PAYLOAD',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Vérification de l'expiration manuelle (optionnel, jwt.verify le fait déjà)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Ajout des informations utilisateur à la requête
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };

    // Log d'audit (optionnel, à désactiver en production si trop verbeux)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] User ${decoded.userId} (${decoded.role}) accessing ${req.method} ${req.path}`);
    }

    next();
  } catch (err) {
    // Gestion des différents types d'erreurs JWT
    let errorResponse: AuthErrorResponse;

    if (err instanceof jwt.TokenExpiredError) {
      errorResponse = {
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      };
    } else if (err instanceof jwt.JsonWebTokenError) {
      errorResponse = {
        success: false,
        message: 'Token invalide',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      };
    } else if (err instanceof jwt.NotBeforeError) {
      errorResponse = {
        success: false,
        message: 'Token pas encore valide',
        code: 'TOKEN_NOT_ACTIVE',
        timestamp: new Date().toISOString()
      };
    } else {
      // Erreur inattendue
      console.error('[AUTH] Erreur inattendue:', err);
      errorResponse = {
        success: false,
        message: 'Erreur d\'authentification interne',
        code: 'INTERNAL_AUTH_ERROR',
        timestamp: new Date().toISOString()
      };
    }

    res.status(401).json(errorResponse);
    return;
  }
};

// Middleware optionnel pour vérifier des rôles spécifiques
export const requireRole = (allowedRoles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: 'Utilisateur non authentifié',
        code: 'USER_NOT_AUTHENTICATED',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      const errorResponse: AuthErrorResponse = {
        success: false,
        message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString()
      };
      res.status(403).json(errorResponse);
      return;
    }

    next();
  };
};

// Middleware optionnel pour les routes publiques avec auth optionnelle
export const optionalAuth = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  // Si pas de header, continuer sans authentification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // Si header présent, essayer de l'authentifier
  authMiddleware(req, res, (err) => {
    if (err) {
      // En cas d'erreur d'auth, continuer quand même (auth optionnelle)
      next();
    } else {
      next();
    }
  });
};

// Export du type pour réutilisation
export type AuthenticatedRequest = CustomRequest;