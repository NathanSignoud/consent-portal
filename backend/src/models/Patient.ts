import mongoose, { Schema, Document } from 'mongoose';

export interface UploadedPDF {
  _id: mongoose.Types.ObjectId;
  filename: string;
  path: string;
}

export interface PatientDocument extends Document {
  name: string;
  age: number;
  pathologies: string[];
  pdfs: UploadedPDF[];
}

const uploadedPdfSchema = new Schema<UploadedPDF>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    filename: { type: String, required: true },
    path: { type: String, required: true },
  },
  { _id: false } // pour ne pas créer un sous-_id en plus automatiquement
);

const patientSchema = new Schema<PatientDocument>({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  pathologies: { type: [String], default: [] },
  pdfs: { type: [uploadedPdfSchema], default: [] },
});

export default mongoose.model<PatientDocument>('Patient', patientSchema);
