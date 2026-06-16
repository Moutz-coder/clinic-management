const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const { generateToken } = require('../utils/helpers');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeDoctorPin = (pin) => String(pin || '').replace(/\D/g, '');

const verifyDoctorPin = (stored, input) => {
  const a = normalizeDoctorPin(stored);
  const b = normalizeDoctorPin(input);
  return a.length === 6 && a === b;
};

const findClinicForDoctorAccess = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return { clinic: null, reason: 'not_found' };

  const owner = await User.findOne({ email: normalized, role: 'clinic', isActive: true });
  if (!owner) return { clinic: null, reason: 'not_found' };

  const clinic = await Clinic.findOne({ userId: owner._id, isActive: true }).populate({
    path: 'userId',
    select: 'name email phone role isActive',
  });

  if (!clinic) return { clinic: null, reason: 'not_found' };
  if (!clinic.isApproved) return { clinic: null, reason: 'pending_approval' };

  return { clinic, reason: null };
};

const doctorAccessMessages = {
  not_found: 'لم يتم العثور على عيادة بهذا البريد. تأكد من إيميل مسؤول العيادة.',
  pending_approval: 'حساب العيادة بانتظار موافقة الإدارة. لا يمكن الدخول حتى تتم الموافقة.',
  no_doctors: 'لا يوجد أطباء مفعّلون. أضف الأطباء وحدّد رمز الدخول من إعدادات العيادة.',
};

const stripDoctorPins = (clinicObj) => {
  if (clinicObj?.doctors) {
    clinicObj.doctors = clinicObj.doctors.map(({ accessPin, ...d }) => d);
  }
  return clinicObj;
};

const defaultWorkingHours = [
  { day: 'sunday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'monday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'tuesday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'wednesday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'thursday', open: '09:00', close: '17:00', isOpen: true },
  { day: 'friday', open: '09:00', close: '13:00', isOpen: true },
  { day: 'saturday', open: '09:00', close: '13:00', isOpen: false },
];

// @desc    تسجيل مريض جديد
exports.registerPatient = async (req, res, next) => {
  try {
    const { name, email, password, birthDate, gender } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userPayload = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'patient',
    };
    if (req.body.phone?.trim()) userPayload.phone = req.body.phone.trim();

    const user = await User.create(userPayload);
    const patient = await Patient.create({ userId: user._id, birthDate, gender });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: { user, patient, token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل عيادة جديدة
exports.registerClinic = async (req, res, next) => {
  try {
    const { name, email, password, clinicName, description, address, clinicPhone, specialties, facilityType } = req.body;
    const normalizedEmail = normalizeEmail(email);

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
      name: clinicName.trim(),
      description: description || '',
      address,
      phone: clinicPhone?.trim() || req.body.phone?.trim() || '—',
      specialties: specialties || [],
      facilityType: ['private', 'hospital'].includes(facilityType) ? facilityType : 'private',
      workingHours: defaultWorkingHours,
      isApproved: false,
    });

    res.status(201).json({
      success: true,
      message: 'تم إرسال طلب التسجيل بنجاح. سيتم إعلامك عند موافقة الإدارة ثم يمكنك تسجيل الدخول.',
      data: { clinicName: clinic.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    قائمة أطباء المركز لتسجيل الدخول
exports.getCenterDoctors = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    const { clinic, reason } = await findClinicForDoctorAccess(email);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: doctorAccessMessages[reason] || doctorAccessMessages.not_found,
      });
    }

    const doctors = (clinic.doctors || [])
      .filter((d) => d.isActive !== false && d.hasAccessPin)
      .map((d) => ({
        _id: d._id,
        name: d.name,
        specialty: d.specialty,
      }));

    if (doctors.length === 0) {
      return res.status(404).json({ success: false, message: doctorAccessMessages.no_doctors });
    }

    res.json({
      success: true,
      data: {
        clinicId: clinic._id,
        clinicName: clinic.name,
        doctors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل دخول الطبيب برمز من 6 أرقام
exports.doctorLogin = async (req, res, next) => {
  try {
    const { clinicEmail, doctorId, pin } = req.body;

    if (!clinicEmail?.trim() || !doctorId || pin === undefined || pin === null || pin === '') {
      return res.status(400).json({ success: false, message: 'البريد والطبيب ورمز الدخول مطلوبة' });
    }

    if (!/^\d{6}$/.test(normalizeDoctorPin(pin))) {
      return res.status(400).json({ success: false, message: 'رمز الدخول يجب أن يكون 6 أرقام' });
    }

    const { clinic, reason } = await findClinicForDoctorAccess(clinicEmail);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: doctorAccessMessages[reason] || doctorAccessMessages.not_found,
      });
    }

    const doctor = clinic.doctors?.id?.(doctorId)
      || clinic.doctors?.find?.((d) => String(d._id) === String(doctorId));

    if (!doctor || doctor.isActive === false || !doctor.hasAccessPin || !doctor.accessPin) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    if (!verifyDoctorPin(doctor.accessPin, pin)) {
      return res.status(401).json({ success: false, message: 'رمز الدخول غير صحيح' });
    }

    const user = clinic.userId;
    if (!user?.isActive) {
      return res.status(403).json({ success: false, message: 'حساب المركز معطل' });
    }

    const token = generateToken(user._id, {
      doctorId: doctor._id.toString(),
      isDoctorSession: true,
    });

    const profile = stripDoctorPins(clinic.toObject());

    const activeDoctor = {
      _id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialty,
      photo: doctor.photo,
    };

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: { ...user.toObject(), name: doctor.name, role: user.role || 'clinic' },
        profile,
        activeDoctor,
        isDoctorSession: true,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل الدخول
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const userWithPassword = await User.findById(user._id).select('+password');
    const isMatch = await bcrypt.compare(password, userWithPassword.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'clinic') {
      profile = await Clinic.findOne({ userId: user._id });
      if (!profile?.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'حساب العيادة بانتظار موافقة الإدارة. لا يمكن تسجيل الدخول حتى تتم الموافقة.',
        });
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: { user, profile, token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على بيانات المستخدم الحالي
exports.getMe = async (req, res, next) => {
  try {
    let profile = null;
    if (req.user.role === 'patient') {
      profile = await Patient.findOne({ userId: req.user._id });
    } else if (req.user.role === 'clinic') {
      const clinicDoc = await Clinic.findOne({ userId: req.user._id });
      profile = clinicDoc ? stripDoctorPins(clinicDoc.toObject()) : null;
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        profile,
        activeDoctor: req.activeDoctor
          ? { _id: req.activeDoctor._id, name: req.activeDoctor.name, specialty: req.activeDoctor.specialty, photo: req.activeDoctor.photo }
          : null,
        isDoctorSession: Boolean(req.isDoctorSession),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث الملف الشخصي
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, birthDate, gender } = req.body;

    if (name) req.user.name = name;
    if (email && normalizeEmail(email) !== req.user.email) {
      const exists = await User.findOne({ email: normalizeEmail(email) });
      if (exists) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم' });
      }
      req.user.email = normalizeEmail(email);
    }
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();

    let profile = null;
    if (req.user.role === 'patient' && req.patient) {
      if (birthDate) req.patient.birthDate = birthDate;
      if (gender) req.patient.gender = gender;
      await req.patient.save();
      profile = req.patient;
    }

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي',
      data: { user: req.user, profile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تغيير كلمة المرور
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'تم تغيير كلمة المرور' });
  } catch (error) {
    next(error);
  }
};
