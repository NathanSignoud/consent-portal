import mongoose from 'mongoose';

const ActionSchema = new mongoose.Schema({
  // === Legacy (on garde pour compat) ===
  label: { type: String, required: true }, // ex: "Toilette corporelle" (sera doublé dans icnp.term.fr)
  status: { type: String, enum: ['à faire', 'réalisé'], default: 'à faire' },
  date: { type: Date, default: null },

  // === Nouveau bloc ICNP normalisé ===
  icnp: {
    id: { type: String, index: true },             // ex: "10030429" (peut être rempli plus tard)
    axis: { type: String, default: 'IC' },         // on pose IC pour interventions
    term: {
      fr: { type: String },                        // ex: "Administrer un vaccin"
      en: { type: String }
    },
    description: {
      fr: { type: String },                        // texte après ":" dans le PDF FR 2019
      en: { type: String }
    }
  },

  // === (Optionnel) champs métier utiles côté UI ===
  patientName: { type: String },
  notes: { type: String }
}, { _id: false });

const ConsentSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  answers: { type: [String], default: [] },
  checkboxes: {
    understood: { type: Boolean, default: false },
    surgeryConsent: { type: Boolean, default: false },
    otherConsent: { type: Boolean, default: false }
  },
  validatedAt: { type: Date, default: Date.now }
}, { _id: false });

const AdresseSchema = new mongoose.Schema({
  rue: { type: String },
  codePostal: { type: String },
  ville: { type: String },
  complement: { type: String },
  latitude: { type: Number },
  longitude: { type: Number }
}, { _id: false });

// Index pour requêtes fréquentes (par date et par code ICNP dans un tableau d'actions)
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
  consents: { type: [ConsentSchema], default: [] },
  adresse: { type: AdresseSchema }
}, { timestamps: true });

// Index composés utiles pour filtrer vite à l'intérieur du tableau actions
Patient2Schema.index({ 'actions.icnp.id': 1 });
Patient2Schema.index({ 'actions.date': 1 });

export default mongoose.model('Patient2', Patient2Schema);
