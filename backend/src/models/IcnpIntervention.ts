// models/IcnpIntervention.ts
import { Schema, model, models } from "mongoose";

const IcnpInterventionSchema = new Schema({
  _id: { type: String },                    // "icnp:10043656"
  icnp_id: { type: String, index: true },   // "10043656"
  axis: { type: String },                   // "IC"
  term: {
    fr: { type: String, index: true },
    en: { type: String }
  },
  description: { fr: { type: String } },
  sct: {
    id: { type: String, default: null, index: true },
    term: { type: String, default: null }
  },
  source: {
    icnp_fr: String,
    icnp_en: String,
    created_at: String
  },
  flags: {
    missing_fr: Boolean,
    has_description: Boolean,
    has_sct: Boolean
  }
}, { versionKey: false });

export default models.IcnpIntervention || model("IcnpIntervention", IcnpInterventionSchema);

