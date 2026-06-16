const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { createNotification } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

const defaultWorkingHours = [
  { day: 'sunday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'monday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'tuesday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'wednesday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'thursday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'friday', open: '09:00', close: '13:00', isOpen: true },
  { day: 'saturday', open: '09:00', close: '13:00', isOpen: false },
];
// @desc    إدارة العيادات
exports.getAllClinics = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status === 'pending') query.isApproved = false;
    else if (status === 'approved') query.isApproved = true;
    if (req.query.active !== undefined) query.isActive = req.query.active === 'true';

    const skip = (page - 1) * limit;
    const [clinics, total] = await Promise.all([
      Clinic.find(query).populate('userId', 'name phone isActive').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Clinic.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: clinics,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تفاصيل عيادة (للمدير)
exports.getClinicById = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id).populate('userId', 'name phone isActive');
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }
    res.json({ success: true, data: clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث بيانات عيادة (للمدير)
exports.updateClinic = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const { name, email, phone, clinicName, description, address, clinicPhone, specialties, facilityType } = req.body;
    const user = await User.findById(clinic.userId);

    if (email && String(email).trim().toLowerCase() !== user?.email) {
      const exists = await User.findOne({ email: String(email).trim().toLowerCase(), _id: { $ne: clinic.userId } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
      }
    }

    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) userUpdate.email = String(email).trim().toLowerCase();
    if (phone !== undefined) userUpdate.phone = phone;
    if (Object.keys(userUpdate).length) {
      await User.findByIdAndUpdate(clinic.userId, userUpdate);
    }

    if (clinicName) clinic.name = clinicName;
    if (description !== undefined) clinic.description = description;
    if (address) clinic.address = address;
    if (clinicPhone) clinic.phone = clinicPhone;
    if (specialties) clinic.specialties = specialties;
    if (facilityType && ['private', 'hospital'].includes(facilityType)) clinic.facilityType = facilityType;

    await clinic.save();

    const updated = await Clinic.findById(clinic._id).populate('userId', 'name email phone isActive');
    res.json({ success: true, message: 'تم تحديث العيادة', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    الموافقة على عيادة
exports.approveClinic = async (req, res, next) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    await createNotification({
      userId: clinic.userId,
      title: 'تمت الموافقة',
      message: 'تمت الموافقة على عيادتك ويمكنك الآن استقبال الحجوزات',
      type: 'clinic_approved',
      relatedId: clinic._id,
    });

    res.json({ success: true, message: 'تمت الموافقة على العيادة', data: clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    تعطيل/تفعيل عيادة
exports.toggleClinicStatus = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    clinic.isActive = !clinic.isActive;
    await clinic.save();

    await User.findByIdAndUpdate(clinic.userId, { isActive: clinic.isActive });

    res.json({
      success: true,
      message: clinic.isActive ? 'تم تفعيل العيادة' : 'تم تعطيل العيادة',
      data: clinic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف عيادة نهائياً
exports.deleteClinic = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const conversations = await Conversation.find({ clinicId: clinic._id }).select('_id');
    const conversationIds = conversations.map((c) => c._id);

    await Promise.all([
      Message.deleteMany({ conversationId: { $in: conversationIds } }),
      Conversation.deleteMany({ clinicId: clinic._id }),
      Appointment.deleteMany({ clinicId: clinic._id }),
      MedicalRecord.deleteMany({ clinicId: clinic._id }),
      Clinic.findByIdAndDelete(clinic._id),
      User.findByIdAndDelete(clinic.userId),
    ]);

    res.json({ success: true, message: 'تم حذف العيادة نهائياً' });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء عيادة (المدير فقط)
exports.createClinic = async (req, res, next) => {
  try {
    const { name, email, password, clinicName, description, address, clinicPhone, specialties, facilityType } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userPayload = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'clinic',
    };
    if (req.body.phone?.trim()) userPayload.phone = req.body.phone.trim();

    const user = await User.create(userPayload);

    const clinic = await Clinic.create({
      userId: user._id,
      name: clinicName,
      facilityType: ['private', 'hospital'].includes(facilityType) ? facilityType : 'private',
      description: description || '',
      address,
      phone: clinicPhone?.trim() || req.body.phone?.trim() || '—',
      specialties: specialties || [],
      workingHours: defaultWorkingHours,
      isApproved: true,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء العيادة بنجاح',
      data: { user: user.toJSON(), clinic },
    });
  } catch (error) {
    next(error);
  }
};
// @desc    إدارة المستخدمين
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تعطيل/تفعيل مستخدم
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'لا يمكن تعطيل المدير' });
    }

    user.isActive = !user.isActive;
    await user.save();

    if (user.role === 'clinic') {
      await Clinic.findOneAndUpdate({ userId: user._id }, { isActive: user.isActive });
    }

    res.json({
      success: true,
      message: user.isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إحصائيات عامة
exports.getGlobalStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalClinics,
      approvedClinics,
      pendingClinics,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      appBookings,
      clinicBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Clinic.countDocuments(),
      Clinic.countDocuments({ isApproved: true, isActive: true }),
      Clinic.countDocuments({ isApproved: false }),
      Appointment.countDocuments({ status: { $ne: 'available' } }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ bookingSource: 'app' }),
      Appointment.countDocuments({ bookingSource: 'clinic' }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalClinics,
        approvedClinics,
        pendingClinics,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        appBookings,
        clinicBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء مدير (للتهيئة الأولية)
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email: normalizedEmail, password: hashedPassword, role: 'admin' });

    res.status(201).json({ success: true, message: 'تم إنشاء المدير', data: admin });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض جميع السجلات الطبية (للمدير)
exports.getAllMedicalRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, clinicId, patientId } = req.query;
    const query = {};

    if (clinicId) query.clinicId = clinicId;
    if (patientId) query.patientId = patientId;

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .populate('clinicId', 'name')
        .populate('patientId', 'userId')
        .populate('patientId.userId', 'name phone')
        .populate('doctorId', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      MedicalRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
