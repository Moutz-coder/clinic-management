const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    birthDate: { type: Date },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    clinicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }],
  },
  { timestamps: true }
);

patientSchema.index({ clinicIds: 1 });

module.exports = mongoose.model('Patient', patientSchema);
