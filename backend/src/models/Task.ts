// models/Task.ts
import { Schema, model, models } from "mongoose";

const TaskSchema = new Schema({
  icnp: {
    id: { type: String, required: true, index: true },   // ex "10030429"
    axis: { type: String, default: "IC" },
    term: { fr: { type: String, required: true }, en: { type: String } },
    description: { fr: { type: String }, en: { type: String } }
  },

  date: { type: String, required: true },        // "YYYY-MM-DD"
  completed: { type: Boolean, default: false },
  notes: String,
  patientId: { type: Schema.Types.ObjectId, ref: "Patient2", index: true }, // <—
  patientName: String,

  userId: { type: String, index: true }
}, { timestamps: true });

TaskSchema.index({ 'icnp.id': 1, userId: 1, date: 1 });

export default models.Task || model("Task", TaskSchema);
