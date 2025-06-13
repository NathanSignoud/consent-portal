import 'express';
import { File } from 'multer';

declare global {
  namespace Express {
    interface Request {
      files?: import('multer').File[];
      file?: import('multer').File;
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
