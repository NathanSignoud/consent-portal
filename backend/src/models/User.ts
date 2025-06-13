import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'Administrator' | 'Doctor' | 'Patient';

export interface UserDocument extends Document {
  email: string;
  password: string;
  role: UserRole;
}

const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Administrator', 'Doctor', 'Patient'],
    default: 'Patient'
  }
});

export default mongoose.model<UserDocument>('User', userSchema);
