const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const bcrypt = require('bcryptjs');
const { patientBelongsToClinic } = require('../utils/helpers');

const normalizeDoctorPin = (pin) => String(pin || '').replace(/\D/g, '');
const {
  buildDoctorResponse,
  buildDoctorsList,
  findDoctorInClinic,
} = require('../utils/clinicDoctors');

// @desc    قائمة فئات التخصصات الطبية
exports.getCategories = async (req, res) => {
  res.json({ success: true, data: MEDICAL_SPECIALTIES });
};

// @desc    تصفح العيادات (عام - بدون تسجيل)
exports.getClinics = async (req, res, next) => {
  try {
    const { search, specialty, category, consultation, page = 1, limit = 10 } = req.query;
    const query = { isApproved: true, isActive: true };

    if (consultation === 'true' || consultation === '1') {
      query.$or = [
        { 'doctorProfile.availableForConsultation': true },
        { doctors: { $elemMatch: { availableForConsultation: true, isActive: { $ne: false } } } },
      ];
    }

    const filterCategory = category || specialty;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } },
      ];
    }
    if (filterCategory && filterCategory !== 'all') {
      query.specialties = { $regex: filterCategory, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [clinics, total] = await Promise.all([
      Clinic.find(query).populate('userId', 'name phone isActive').skip(skip).limit(Number(limit)).sort({ name: 1 }),
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


// @desc    تفاصيل عيادة
exports.getClinicById = async (req, res, next) => {
  try {
    const clinic = await Clinic.findOne({
      _id: req.params.id,
      isActive: true,
      isApproved: true,
    }).populate('userId', 'name');
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const data = clinic.toObject();
    data.doctors = buildDoctorsList(clinic);
    data.doctor = data.doctors[0] || buildDoctorResponse(clinic);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل مشاهدة ملف الطبيب
exports.trackDoctorView = async (req, res, next) => {
  try {
    const { doctorId } = req.body || {};
    const clinic = await Clinic.findOne({
      _id: req.params.id,
      isActive: true,
      isApproved: true,
    });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const { type, doc } = findDoctorInClinic(clinic, doctorId);
    let views = 0;

    if (type === 'doctor' && doc) {
      doc.views = (doc.views || 0) + 1;
      views = doc.views;
      clinic.markModified('doctors');
    } else {
      if (!clinic.doctorProfile) clinic.doctorProfile = {};
      clinic.doctorProfile.views = (clinic.doctorProfile.views || 0) + 1;
      views = clinic.doctorProfile.views;
    }

    await clinic.save();
    res.json({ success: true, data: { views } });
  } catch (error) {
    next(error);
  }
};

// @desc    تقييم الطبيب
exports.rateDoctor = async (req, res, next) => {
  try {
    const { rating, doctorId } = req.body;
    const value = Number(rating);

    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    const clinic = await Clinic.findOne({
      _id: req.params.id,
      isActive: true,
      isApproved: true,
    });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const { type, doc } = findDoctorInClinic(clinic, doctorId);
    let ratingOut = 0;
    let ratingCount = 0;

    if (type === 'doctor' && doc) {
      const currentCount = doc.ratingCount || 0;
      const currentRating = doc.rating || 0;
      const newCount = currentCount + 1;
      doc.ratingCount = newCount;
      doc.rating = Math.round((((currentRating * currentCount) + value) / newCount) * 10) / 10;
      ratingOut = doc.rating;
      ratingCount = doc.ratingCount;
      clinic.markModified('doctors');
    } else {
      if (!clinic.doctorProfile) clinic.doctorProfile = {};
      const currentCount = clinic.doctorProfile.ratingCount || 0;
      const currentRating = clinic.doctorProfile.rating || 0;
      const newCount = currentCount + 1;
      clinic.doctorProfile.ratingCount = newCount;
      clinic.doctorProfile.rating = Math.round((((currentRating * currentCount) + value) / newCount) * 10) / 10;
      ratingOut = clinic.doctorProfile.rating;
      ratingCount = clinic.doctorProfile.ratingCount;
    }

    await clinic.save();

    res.json({
      success: true,
      message: 'شكراً لتقييمك',
      data: { rating: ratingOut, ratingCount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث بيانات العيادة
exports.updateClinic = async (req, res, next) => {
  try {
    if (!req.clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const { name, description, address, phone, specialties, workingHours, doctorProfile, facilityType } = req.body;
    const clinic = req.clinic;

    if (name) clinic.name = name;
    if (facilityType && ['private', 'hospital'].includes(facilityType)) clinic.facilityType = facilityType;
    if (description !== undefined) clinic.description = description;
    if (address) clinic.address = address;
    if (phone) clinic.phone = phone;
    if (specialties) clinic.specialties = specialties;
    if (workingHours) clinic.workingHours = workingHours;

    if (doctorProfile && typeof doctorProfile === 'object') {
      const current = clinic.doctorProfile?.toObject?.() ?? clinic.doctorProfile ?? {};
      clinic.doctorProfile = { ...current, ...doctorProfile };
      clinic.markModified('doctorProfile');
    }

    await clinic.save();
    res.json({ success: true, message: 'تم تحديث بيانات العيادة', data: clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    رفع صورة الطبيب
exports.uploadDoctorPhoto = async (req, res, next) => {
  try {
    if (!req.clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }

    if (!req.clinic.doctorProfile) req.clinic.doctorProfile = {};
    req.clinic.doctorProfile.photo = `/uploads/${req.file.filename}`;
    await req.clinic.save();
    res.json({ success: true, message: 'تم رفع صورة الطبيب', data: req.clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    رفع صورة العيادة
exports.uploadClinicImage = async (req, res, next) => {
  try {
    if (!req.clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار صورة' });
    }

    req.clinic.image = `/uploads/${req.file.filename}`;
    await req.clinic.save();
    res.json({ success: true, message: 'تم رفع الصورة', data: req.clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة تخصص
exports.addSpecialty = async (req, res, next) => {
  try {
    const { specialty } = req.body;
    if (!specialty) {
      return res.status(400).json({ success: false, message: 'التخصص مطلوب' });
    }

    if (!req.clinic.specialties.includes(specialty)) {
      req.clinic.specialties.push(specialty);
      await req.clinic.save();
    }

    res.json({ success: true, message: 'تم إضافة التخصص', data: req.clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف تخصص
exports.removeSpecialty = async (req, res, next) => {
  try {
    req.clinic.specialties = req.clinic.specialties.filter((s) => s !== req.params.specialty);
    await req.clinic.save();
    res.json({ success: true, message: 'تم حذف التخصص', data: req.clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث ساعات العمل
exports.updateWorkingHours = async (req, res, next) => {
  try {
    const { workingHours } = req.body;
    req.clinic.workingHours = workingHours;
    await req.clinic.save();
    res.json({ success: true, message: 'تم تحديث ساعات العمل', data: req.clinic });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض جميع المرضى للعيادة
exports.getClinicPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const clinicId = req.clinic._id;

    const appointmentPatientIds = await Appointment.distinct('patientId', {
      clinicId,
      patientId: { $ne: null },
    });

    const query = {
      $or: [
        { clinicIds: clinicId },
        { _id: { $in: appointmentPatientIds } },
      ],
    };

    const patients = await Patient.find(query).populate('userId', 'name phone');

    let filtered = patients;
    if (search) {
      const term = search.toLowerCase();
      filtered = patients.filter(
        (p) =>
          p.userId?.name?.toLowerCase().includes(term) ||
          p.userId?.phone?.includes(term)
      );
    }

    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: { total: filtered.length, page: Number(page), pages: Math.ceil(filtered.length / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ملف مريض
exports.getPatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId).populate('userId', 'name phone');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    }

    const hasRelation = await patientBelongsToClinic(patient._id, req.clinic._id);

    if (!hasRelation) {
      return res.status(403).json({ success: false, message: 'لا يمكن عرض هذا المريض' });
    }

    const appointments = await Appointment.find({
      clinicId: req.clinic._id,
      patientId: patient._id,
    }).sort({ appointmentDate: -1 });

    res.json({ success: true, data: { patient, appointments } });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء مريض جديد من العيادة
exports.createPatientFromClinic = async (req, res, next) => {
  try {
    const { name, phone, password, birthDate, gender, email } = req.body;
    const clinicId = req.clinic._id;

    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
    }

    const normalizedPhone = phone.trim();
    const patientEmail = email?.trim()
      ? email.trim().toLowerCase()
      : `patient_${normalizedPhone.replace(/\D/g, '')}@clinic.local`;

    let user = await User.findOne({ $or: [{ phone: normalizedPhone }, { email: patientEmail }] });
    let patient;

    if (user) {
      patient = await Patient.findOne({ userId: user._id });
      if (!patient) {
        return res.status(400).json({ success: false, message: 'المستخدم موجود لكن ليس مريضاً' });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password || '123456', 12);
      user = await User.create({
        name,
        email: patientEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        role: 'patient',
      });
      patient = await Patient.create({ userId: user._id, birthDate, gender, clinicIds: [clinicId] });
    }

    if (!patient.clinicIds.some((id) => id.toString() === clinicId.toString())) {
      patient.clinicIds.push(clinicId);
      await patient.save();
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء/جلب المريض',
      data: { user: user.toJSON(), patient },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    لوحة تحكم العيادة
exports.getDashboard = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      upcomingBookings,
      appBookings,
      clinicBookings,
      newPatientsThisMonth,
      monthlyVisits,
    ] = await Promise.all([
      Appointment.distinct('patientId', { clinicId, patientId: { $ne: null } }).then((ids) => ids.length),
      Appointment.countDocuments({ clinicId, status: { $ne: 'available' } }),
      Appointment.countDocuments({ clinicId, status: 'completed' }),
      Appointment.countDocuments({ clinicId, status: 'cancelled' }),
      Appointment.countDocuments({ clinicId, status: 'booked', appointmentDate: { $gte: now } }),
      Appointment.countDocuments({ clinicId, bookingSource: 'app', status: { $ne: 'available' } }),
      Appointment.countDocuments({ clinicId, bookingSource: 'clinic', status: { $ne: 'available' } }),
      Appointment.distinct('patientId', {
        clinicId,
        patientId: { $ne: null },
        createdAt: { $gte: startOfMonth },
      }).then((ids) => ids.length),
      Appointment.countDocuments({
        clinicId,
        status: 'completed',
        appointmentDate: { $gte: startOfMonth },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        upcomingBookings,
        appBookings,
        clinicBookings,
        newPatientsThisMonth,
        monthlyVisits,
      },
    });
  } catch (error) {
    next(error);
  }
};

const doctorFields = ['name', 'specialty', 'degree', 'gender', 'rank', 'country', 'city', 'availableForConsultation', 'bio', 'photo'];

// @desc    إضافة طبيب للمركز
exports.addDoctor = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'اسم الطبيب مطلوب' });
    }

    const { accessPin } = req.body;
    if (!accessPin || !/^\d{6}$/.test(String(accessPin))) {
      return res.status(400).json({ success: false, message: 'رمز الدخول يجب أن يكون 6 أرقام' });
    }

    const doctor = { name: name.trim() };
    doctorFields.forEach((f) => {
      if (req.body[f] !== undefined) doctor[f] = req.body[f];
    });

    doctor.accessPin = normalizeDoctorPin(accessPin);
    doctor.hasAccessPin = true;

    clinic.doctors.push(doctor);
    await clinic.save();

    const added = clinic.doctors[clinic.doctors.length - 1];
    const response = added.toObject();
    delete response.accessPin;
    res.status(201).json({ success: true, message: 'تم إضافة الطبيب', data: response });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث طبيب في المركز
exports.updateDoctor = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const doc = clinic.doctors.id(req.params.doctorId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    doctorFields.forEach((f) => {
      if (req.body[f] !== undefined) doc[f] = req.body[f];
    });

    await clinic.save();
    res.json({ success: true, message: 'تم تحديث بيانات الطبيب', data: doc });
  } catch (error) {
    next(error);
  }
};

// @desc    تعيين أو تعديل رمز دخول الطبيب (6 أرقام)
exports.resetDoctorPin = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const doc = clinic.doctors.id(req.params.doctorId);
    if (!doc || doc.isActive === false) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(normalizeDoctorPin(pin))) {
      return res.status(400).json({ success: false, message: 'رمز الدخول يجب أن يكون 6 أرقام' });
    }

    await Clinic.updateOne(
      { _id: clinic._id, 'doctors._id': doc._id },
      { $set: { 'doctors.$.accessPin': normalizeDoctorPin(pin), 'doctors.$.hasAccessPin': true } }
    );

    res.json({
      success: true,
      message: 'تم حفظ رمز الدخول',
      data: { doctorId: doc._id },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف طبيب من المركز
exports.removeDoctor = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const doc = clinic.doctors.id(req.params.doctorId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    doc.isActive = false;
    await clinic.save();
    res.json({ success: true, message: 'تم إزالة الطبيب' });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث دوام العيادة العام (لصاحب العيادة فقط)
exports.updateGeneralWorkingHours = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const { generalWorkingHours } = req.body;

    if (!generalWorkingHours) {
      return res.status(400).json({ success: false, message: 'بيانات الدوام مطلوبة' });
    }

    clinic.generalWorkingHours = generalWorkingHours;
    await clinic.save();

    res.json({ success: true, message: 'تم تحديث دوام العيادة', data: clinic.generalWorkingHours });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث أوقات دوام الطبيب (للطبيب فقط)
exports.updateDoctorWorkingDays = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const { doctorId } = req.params;
    const { workingDays } = req.body;

    if (!workingDays) {
      return res.status(400).json({ success: false, message: 'بيانات الدوام مطلوبة' });
    }

    const doctor = clinic.doctors.id(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'الطبيب غير موجود' });
    }

    doctor.workingDays = workingDays;
    await clinic.save();

    res.json({ success: true, message: 'تم تحديث أوقات دوام الطبيب', data: doctor.workingDays });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على إحصائيات الأطباء (لصاحب العيادة)
exports.getDoctorsStatistics = async (req, res, next) => {
  try {
    const clinic = req.clinic;
    const doctors = clinic.doctors.filter(d => d.isActive);

    const statistics = await Promise.all(
      doctors.map(async (doctor) => {
        const totalAppointments = await Appointment.countDocuments({
          clinicId: clinic._id,
          doctorId: doctor._id,
        });

        const completedAppointments = await Appointment.countDocuments({
          clinicId: clinic._id,
          doctorId: doctor._id,
          status: 'completed',
        });

        const cancelledAppointments = await Appointment.countDocuments({
          clinicId: clinic._id,
          doctorId: doctor._id,
          status: 'cancelled',
        });

        const uniquePatients = await Appointment.distinct('patientId', {
          clinicId: clinic._id,
          doctorId: doctor._id,
        });

        return {
          doctorId: doctor._id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          pendingAppointments: totalAppointments - completedAppointments - cancelledAppointments,
          uniquePatients: uniquePatients.length,
          rating: doctor.rating,
          ratingCount: doctor.ratingCount,
        };
      })
    );

    res.json({ success: true, data: statistics });
  } catch (error) {
    next(error);
  }
};
