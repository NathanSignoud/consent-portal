import mongoose from 'mongoose';

const ActionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  status: { type: String, enum: ['à faire', 'réalisé'], default: 'à faire' },
  date: { type: Date, default: null }
});

const ConsentSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  answers: { type: [String], default: [] },
  checkboxes: {
    understood: { type: Boolean, default: false },
    surgeryConsent: { type: Boolean, default: false },
    otherConsent: { type: Boolean, default: false }
  },
  validatedAt: { type: Date, default: Date.now }
});

const Patient2Schema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String },
  dateNaissance: { type: Date },
  sexe: { type: String },
  statutIdentite: { type: String },
  uniteOrganisationnelle: { type: String },
  ipp: { type: String },
  situationDossier: { type: String },
  dateDebutPriseEnCharge: { type: Date },
  dateSortieEffective: { type: Date },
  dateSortiePrevue: { type: Date },
  hopitalProvenance: { type: String },
  pathologies: { type: [String], default: [] },
  actions: { type: [ActionSchema], default: [] },
  consents: { type: [ConsentSchema], default: [] }
}, { timestamps: true });

export default mongoose.model('Patient2', Patient2Schema);
