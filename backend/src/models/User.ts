// models/user.ts
import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'Administrator' | 'Doctor' | 'Patient';

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
}

const calendarTaskSchema = new Schema<CalendarTask>({
  title: { type: String, required: true },
  date: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const userSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Administrator', 'Doctor', 'Patient'],
    default: 'Patient',
  },
  calendarTasks: [calendarTaskSchema],
});

export default mongoose.model<UserDocument>('User', userSchema);
