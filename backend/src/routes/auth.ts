import express, { Request, Response } from 'express';
import User, { UserDocument } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


import rateLimit from 'express-rate-limit';
import { validateRequest, PATTERNS } from '../middlewares/validateRequest';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';

const router = express.Router();


// Vérification obligatoire du JWT_SECRET

if (!process.env.JWT_SECRET) {
  console.error('ERREUR CRITIQUE: JWT_SECRET manquant dans les variables d\'environnement');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Rate limiting simple sans express-rate-limit (à remplacer si vous l'installez)
const createSimpleRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map();
  
  return (req: Request, res: Response, next: any) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const validRequests = userRequests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Réessayez plus tard.',
        code: 'TOO_MANY_REQUESTS',
        timestamp: new Date().toISOString()
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    next();
  };
};

const loginLimiter = createSimpleRateLimit(5, 15 * 60 * 1000); // 5 req per 15min
const registerLimiter = createSimpleRateLimit(3, 60 * 60 * 1000); // 3 req per hour

// Validation des données de connexion
const validateLogin = validateRequest({
  email: { 
    required: true, 
    type: 'email',
    maxLength: 255
  },
  password: { 
    required: true, 
    type: 'string',
    minLength: 1,
    maxLength: 128
  }
});

// Validation des données d'inscription
const validateRegister = validateRequest({
  email: { 
    required: true, 
    type: 'email',
    maxLength: 255
  },
  password: { 
    required: true, 
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) return 'Le mot de passe doit contenir au moins une minuscule';
      if (!/(?=.*[A-Z])/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule';
      if (!/(?=.*\d)/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre';
      if (!/(?=.*[@$!%*?&])/.test(value)) return 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)';
      return true;
    }
  },
  role: { 
    required: false, 
    type: 'string',
    enum: ['user', 'admin', 'nurse', 'doctor']
  }
});

// Helper pour générer un token JWT (version de contournement)
const generateToken = (user: any): string => {
  try {
    const payload = { 
      userId: String(user._id),
      email: String(user.email),
      role: String(user.role)
    };
    
    // Contournement TypeScript pour jwt.sign
    return (jwt as any).sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Erreur génération token:', error);
    throw new Error('Impossible de générer le token');
  }
};

// Helper pour la réponse utilisateur (sans mot de passe)
const userResponse = (user: any, token?: string) => {
  const response: any = {
    success: true,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt || new Date(),
      lastLogin: user.lastLogin || null
    }
  };

  if (token) {
    response.token = token;
    response.expiresIn = JWT_EXPIRES_IN;
  }

  return response;
};

// POST /api/auth/login
router.post('/login', 
  loginLimiter,
  validateLogin,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Timing attack protection
    const user: any = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!user) {
      await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks.in.case.user.not.found');
      throw createError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Vérifier si le compte est actif (si cette propriété existe)
    if (user.isBlocked) {
      throw createError('Compte bloqué. Contactez l\'administrateur.', 403, 'ACCOUNT_BLOCKED');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Tentative de connexion échouée pour: ${email} depuis IP: ${req.ip}`);
      throw createError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Mettre à jour la date de dernière connexion (si la propriété existe)
    if (user.lastLogin !== undefined) {
      user.lastLogin = new Date();
      await user.save();
    }

    const token = generateToken(user);

    console.log(`Connexion réussie pour: ${email} depuis IP: ${req.ip}`);

    res.json(userResponse(user, token));
  })
);

// POST /api/auth/register
router.post('/register',
  registerLimiter,
  validateRegister,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role = 'user' } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'utilisateur existe déjà
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw createError('Un compte avec cet email existe déjà', 409, 'EMAIL_ALREADY_EXISTS');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Créer l'utilisateur
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });

    await newUser.save();

    console.log(`Nouveau compte créé pour: ${normalizedEmail} avec le rôle: ${role}`);

    // Générer un token automatiquement
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      ...userResponse(newUser, token)
    });
  })
);

// GET /api/auth/me - Récupérer les infos de l'utilisateur connecté
router.get('/me',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user!.id).select('-password');
    
    if (!user) {
      throw createError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    res.json(userResponse(user));
  })
);

// POST /api/auth/refresh - Renouveler le token
router.post('/refresh',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    
    if (!user) {
      throw createError('Utilisateur introuvable ou inactif', 401, 'USER_INACTIVE');
    }

    const newToken = generateToken(user);

    res.json({
      success: true,
      token: newToken,
      expiresIn: JWT_EXPIRES_IN
    });
  })
);

// POST /api/auth/logout
router.post('/logout',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  })
);

// POST /api/auth/change-password
router.post('/change-password',
  authMiddleware,
  validateRequest({
    currentPassword: { required: true, type: 'string' },
    newPassword: { 
      required: true, 
      type: 'string',
      minLength: 8,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) return 'Le nouveau mot de passe doit contenir au moins une minuscule';
        if (!/(?=.*[A-Z])/.test(value)) return 'Le nouveau mot de passe doit contenir au moins une majuscule';
        if (!/(?=.*\d)/.test(value)) return 'Le nouveau mot de passe doit contenir au moins un chiffre';
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Le nouveau mot de passe doit contenir au moins un caractère spécial';
        return true;
      }
    }
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user!.id).select('+password');
    if (!user) {
      throw createError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw createError('Mot de passe actuel incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw createError('Le nouveau mot de passe doit être différent de l\'actuel', 400, 'SAME_PASSWORD');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();

    console.log(`Mot de passe changé pour: ${user.email}`);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  })
);

export default router;