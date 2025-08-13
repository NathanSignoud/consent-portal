// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'nurse' | 'doctor';

export interface CalendarTask {
  _id?: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface UserDocument extends Document {
  email: string;
  password: string;
  role: UserRole;
  calendarTasks: CalendarTask[];
  createdAt?: Date;
  lastLogin?: Date;
  isBlocked?: boolean;
}

const calendarTaskSchema = new Schema<CalendarTask>({
  title: { type: String, required: true },
  date: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const userSchema = new Schema<UserDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    select: false // Par défaut, ne pas inclure le mot de passe dans les requêtes
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'nurse', 'doctor'],
    default: 'user',
  },
  calendarTasks: [calendarTaskSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index pour améliorer les performances de recherche par email
userSchema.index({ email: 1 });

export default mongoose.model<UserDocument>('User', userSchema);