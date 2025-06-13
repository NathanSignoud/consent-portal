// src/middlewares/validateRequest.ts
import { Request, Response, NextFunction } from 'express';

export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `Le champ ${field} est obligatoire.` });
      }
    }
    next();
  };
};
