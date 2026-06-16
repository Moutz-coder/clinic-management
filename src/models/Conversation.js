const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    lastMessageAt: { type: Date, default: Date.now },
    patientLastReadAt: { type: Date, default: null },
    clinicLastReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ patientId: 1, clinicId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
