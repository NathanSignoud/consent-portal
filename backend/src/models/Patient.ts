import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  filename: String,
  path: String,
});

const patientSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  dateNaissance: { type: String, required: true },
  datePriseEnCharge: { type: String },
  numeroContact: { type: String },
  adresse: { type: String },
  codePostal: { type: String },
  pathologies: { type: [String], default: [] },
  allergies: { type: [String], default: [] },
  medication: { type: [String], default: [] },
  pdfs: [pdfSchema],
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
