const mongoose = require('mongoose');

const closedDaySchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    date: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

closedDaySchema.index({ clinicId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ClosedDay', closedDaySchema);
