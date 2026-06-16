const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود أو معطل' });
    }

    req.user = user;
    req.isDoctorSession = Boolean(decoded.isDoctorSession && decoded.doctorId);

    if (user.role === 'clinic') {
      req.clinic = await Clinic.findOne({ userId: user._id });
      if (req.isDoctorSession && req.clinic) {
        const doctor = req.clinic.doctors?.id?.(decoded.doctorId)
          || req.clinic.doctors?.find?.((d) => String(d._id) === String(decoded.doctorId));
        if (!doctor || doctor.isActive === false || !doctor.hasAccessPin || !doctor.accessPin) {
          return res.status(401).json({ success: false, message: 'جلسة الطبيب غير صالحة' });
        }
        req.activeDoctor = doctor;
      }
    } else if (user.role === 'patient') {
      req.patient = await Patient.findOne({ userId: user._id });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'رمز الدخول غير صالح' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول' });
    }
    next();
  };
};

const requireApprovedClinic = (req, res, next) => {
  if (req.user.role === 'clinic') {
    if (!req.clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }
    if (!req.clinic.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'حساب العيادة بانتظار موافقة الإدارة. لا يمكن الوصول حتى تتم الموافقة.',
      });
    }
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user?.isActive) {
        req.user = user;
        if (user.role === 'patient') {
          req.patient = await Patient.findOne({ userId: user._id });
        }
      }
    }
    next();
  } catch {
    next();
  }
};

const requireClinicAdmin = (req, res, next) => {
  if (req.isDoctorSession) {
    return res.status(403).json({ success: false, message: 'هذه العملية متاحة لمسؤول المركز فقط' });
  }
  next();
};

module.exports = { protect, authorize, requireApprovedClinic, requireClinicAdmin, optionalAuth };
