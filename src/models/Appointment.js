const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    appointmentDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['available', 'pending_confirmation', 'booked', 'completed', 'cancelled', 'no_show'],
      default: 'available',
    },
    bookingSource: {
      type: String,
      enum: ['app', 'clinic'],
      default: null,
    },
    confirmationRequestedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    doctorId: { type: String, default: null },
    doctorName: { type: String, default: '' },
  },
  { timestamps: true }
);

appointmentSchema.index({ clinicId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
