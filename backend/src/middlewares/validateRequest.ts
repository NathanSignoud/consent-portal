import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Types pour la validation
type ValidationRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'date' | 'objectId';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
};

type ValidationSchema = {
  [key: string]: ValidationRule;
};

type ValidationError = {
  field: string;
  message: string;
  value?: any;
};

// Regex patterns utiles
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  objectId: /^[0-9a-fA-F]{24}$/,
  phone: /^(\+33|0)[1-9](\d{8})$/,
  postalCode: /^[0-9]{5}$/,
  url: /^https?:\/\/.+/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Fonction de validation d'un champ
const validateField = (field: string, value: any, rule: ValidationRule): ValidationError | null => {
  // Si le champ est requis et manquant/vide
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      field,
      message: `Le champ '${field}' est obligatoire`,
      value
    };
  }

  // Si le champ n'est pas requis et est vide, on passe
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Validation du type
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field,
            message: `Le champ '${field}' doit être une chaîne de caractères`,
            value
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' && !(!isNaN(Number(value)))) {
          return {
            field,
            message: `Le champ '${field}' doit être un nombre`,
            value
          };
        }
        value = Number(value); // Conversion
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return {
            field,
            message: `Le champ '${field}' doit être un booléen`,
            value
          };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return {
            field,
            message: `Le champ '${field}' doit être un tableau`,
            value
          };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return {
            field,
            message: `Le champ '${field}' doit être un objet`,
            value
          };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !PATTERNS.email.test(value)) {
          return {
            field,
            message: `Le champ '${field}' doit être un email valide`,
            value
          };
        }
        break;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            field,
            message: `Le champ '${field}' doit être une date valide`,
            value
          };
        }
        break;

      case 'objectId':
        if (typeof value !== 'string' || !PATTERNS.objectId.test(value)) {
          return {
            field,
            message: `Le champ '${field}' doit être un ObjectId MongoDB valide`,
            value
          };
        }
        break;
    }
  }

  // Validation de longueur pour les chaînes
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return {
        field,
        message: `Le champ '${field}' doit contenir au moins ${rule.minLength} caractères`,
        value
      };
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return {
        field,
        message: `Le champ '${field}' ne peut pas dépasser ${rule.maxLength} caractères`,
        value
      };
    }
  }

  // Validation de valeur min/max pour les nombres
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return {
        field,
        message: `Le champ '${field}' doit être supérieur ou égal à ${rule.min}`,
        value
      };
    }
    if (rule.max !== undefined && value > rule.max) {
      return {
        field,
        message: `Le champ '${field}' doit être inférieur ou égal à ${rule.max}`,
        value
      };
    }
  }

  // Validation de pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return {
      field,
      message: `Le champ '${field}' ne respecte pas le format attendu`,
      value
    };
  }

  // Validation enum
  if (rule.enum && !rule.enum.includes(value)) {
    return {
      field,
      message: `Le champ '${field}' doit être l'une des valeurs suivantes: ${rule.enum.join(', ')}`,
      value
    };
  }

  // Validation personnalisée
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      return {
        field,
        message: typeof customResult === 'string' ? customResult : `Le champ '${field}' n'est pas valide`,
        value
      };
    }
  }

  return null;
};

// Middleware principal de validation
export const validateRequest = (schema: ValidationSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const errors: ValidationError[] = [];

    // Valider chaque champ du schéma
    for (const [field, rule] of Object.entries(schema)) {
      const error = validateField(field, data[field], rule);
      if (error) {
        errors.push(error);
      }
    }

    // Si des erreurs, retourner une réponse d'erreur
    if (errors.length > 0) {
      const errorResponse = {
        success: false,
        message: 'Erreurs de validation',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        errors
      };

      res.status(400).json(errorResponse);
      return;
    }

    next();
  };
};

// Middleware simple pour les champs requis (backward compatibility)
export const validateBody = (requiredFields: string[]) => {
  const schema: ValidationSchema = {};
  requiredFields.forEach(field => {
    schema[field] = { required: true };
  });
  return validateRequest(schema, 'body');
};

// Middlewares pré-configurés utiles
export const validatePatientCreation = validateRequest({
  nom: { required: true, type: 'string', minLength: 2, maxLength: 50 },
  prenom: { required: false, type: 'string', maxLength: 50 },
  dateNaissance: { required: false, type: 'date' },
  sexe: { required: false, type: 'string', enum: ['M', 'F', 'Autre'] },
  adresse: { required: false, type: 'object' }
});

export const validateTaskCreation = validateRequest({
  'icnp.id': { required: true, type: 'string' },
  'icnp.term.fr': { required: true, type: 'string', minLength: 3 },
  date: { 
    required: true, 
    type: 'string', 
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    custom: (value: string) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today || 'La date ne peut pas être dans le passé';
    }
  },
  userId: { required: true, type: 'string' },
  patientId: { required: false, type: 'objectId' },
  notes: { required: false, type: 'string', maxLength: 500 }
});

export const validateUserAuth = validateRequest({
  email: { required: true, type: 'email' },
  password: { 
    required: true, 
    type: 'string', 
    minLength: 8,
    pattern: PATTERNS.strongPassword,
    custom: (value: string) => {
      if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
      if (!/(?=.*[a-z])/.test(value)) return 'Le mot de passe doit contenir au moins une minuscule';
      if (!/(?=.*[A-Z])/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule';
      if (!/(?=.*\d)/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre';
      if (!/(?=.*[@$!%*?&])/.test(value)) return 'Le mot de passe doit contenir au moins un caractère spécial';
      return true;
    }
  }
});

export const validateObjectId = (paramName: string = 'id') => {
  const schema: ValidationSchema = {};
  schema[paramName] = { required: true, type: 'objectId' };
  return validateRequest(schema, 'params');
};

export const validatePagination = validateRequest({
  page: { required: false, type: 'number', min: 1 },
  limit: { required: false, type: 'number', min: 1, max: 100 },
  sort: { required: false, type: 'string' }
}, 'query');

// Helper pour validation conditionnelle
export const validateConditional = (
  condition: (req: Request) => boolean,
  schema: ValidationSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      return validateRequest(schema, source)(req, res, next);
    }
    next();
  };
};

// Export des patterns pour utilisation externe
export { PATTERNS };

// Exemples d'usage:
/*
// Usage basique:
router.post('/patients', validatePatientCreation, createPatient);

// Usage avec schéma personnalisé:
router.post('/tasks', validateRequest({
  title: { required: true, type: 'string', minLength: 3, maxLength: 100 },
  dueDate: { required: true, type: 'date' },
  priority: { required: false, type: 'string', enum: ['low', 'medium', 'high'] }
}), createTask);

// Validation des paramètres d'URL:
router.get('/patients/:id', validateObjectId(), getPatient);

// Validation des query parameters:
router.get('/patients', validatePagination, getPatients);

// Validation conditionnelle:
router.patch('/patients/:id', validateConditional(
  (req) => req.body.email !== undefined,
  { email: { required: true, type: 'email' } }
), updatePatient);
*/