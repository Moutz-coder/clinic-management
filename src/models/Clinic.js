const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true,
    },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    photo: { type: String, default: '' },
    specialty: { type: String, default: '' },
    degree: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    rank: { type: String, default: '' },
    country: { type: String, default: 'LY' },
    city: { type: String, default: '' },
    availableForConsultation: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    bio: { type: String, default: '' },
  },
  { _id: false }
);

const clinicDoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: '' },
    specialty: { type: String, default: '' },
    degree: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    rank: { type: String, default: '' },
    country: { type: String, default: 'LY' },
    city: { type: String, default: '' },
    availableForConsultation: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    accessPin: { type: String, default: '' },
    hasAccessPin: { type: Boolean, default: false },
    // أوقات دوام الطبيب (يحددها الطبيب فقط)
    workingDays: {
      sunday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      monday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      tuesday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      wednesday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      thursday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      friday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      saturday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
    },
  },
  { timestamps: true }
);

const clinicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    specialties: [{ type: String, trim: true }],
    workingHours: [workingHoursSchema],
    // دوام العيادة العام (يحدده صاحب العيادة فقط)
    generalWorkingHours: {
      sunday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      monday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      tuesday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      wednesday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      thursday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      friday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
      saturday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' } },
    },
    image: { type: String, default: '' },
    facilityType: { type: String, enum: ['private', 'hospital'], default: 'private' },
    doctorProfile: { type: doctorProfileSchema, default: () => ({}) },
    doctors: [clinicDoctorSchema],
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clinicSchema.index({ name: 'text', specialties: 'text' });

module.exports = mongoose.model('Clinic', clinicSchema);
