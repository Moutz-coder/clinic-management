const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    visitDate: { type: Date, required: true, default: Date.now },
    reason: { type: String, required: true },
    diagnosis: { type: String, default: '' },
    treatment: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1, clinicId: 1, visitDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
