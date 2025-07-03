import mongoose from 'mongoose';

const ConsentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient2',
    required: true
  },
  sectionTitle: {
    type: String,
    required: true
  },
  answers: {
    type: [String],
    default: []
  },
  checkboxes: {
    understood: Boolean,
    surgeryConsent: Boolean,
    otherConsent: Boolean
  },
  validatedAt: {
    type: Date,
    default: Date.now
  }
});

const Consent = mongoose.model('Consent', ConsentSchema);
export default Consent;
