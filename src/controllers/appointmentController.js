const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const User = require('../models/User');
const ClosedDay = require('../models/ClosedDay');
const { createNotification } = require('../utils/helpers');
const {
  validatePatientBooking,
  sendConfirmationMessage,
  confirmAppointment,
  releasePendingAppointment,
  ACTIVE_STATUSES,
} = require('../utils/appointmentBooking');
const {
  getDayBounds,
  getNextDays,
  getScheduleMonthDays,
  buildDaySchedule,
  buildPatientDaySchedule,
  buildDateWithHour,
  formatLocalDate,
  matchAppointmentHour,
  WORKING_HOURS,
  isAppointmentInPast,
} = require('../utils/schedule');

// @desc    إضافة مواعيد متاحة (العيادة)
exports.createAvailableSlots = async (req, res, next) => {
  try {
    const { slots } = req.body;

    if (!slots?.length) {
      return res.status(400).json({ success: false, message: 'يجب تحديد موعد واحد على الأقل' });
    }

    const appointments = slots.map((date) => ({
      clinicId: req.clinic._id,
      appointmentDate: new Date(date),
      status: 'available',
    }));

    const created = await Appointment.insertMany(appointments);
    res.status(201).json({ success: true, message: 'تم إضافة المواعيد المتاحة', data: created });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض المواعيد المتاحة لعيادة (عام)
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const now = new Date();

    const slots = await Appointment.find({
      clinicId,
      status: 'available',
      appointmentDate: { $gt: now },
    }).sort({ appointmentDate: 1 });

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @desc    قائمة الأيام القادمة مع عدد المواعيد المتاحة
exports.getScheduleDays = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const clinic = await Clinic.findOne({ _id: clinicId, isApproved: true, isActive: true });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const days = getScheduleMonthDays();
    const now = new Date();
    const availableOnly = req.query.availableOnly === 'true' || req.query.availableOnly === '1';
    const dateStrings = days.map((d) => d.date);
    const closedDays = await ClosedDay.find({ clinicId, date: { $in: dateStrings } });
    const closedSet = new Set(closedDays.map((c) => c.date));

    const daySummaries = await Promise.all(
      days.map(async ({ date, dateObj }) => {
        const isClosed = closedSet.has(date);
        const { start, end } = getDayBounds(date);
        const availableStart = start < now ? now : start;
        const [available, booked] = await Promise.all([
          isClosed
            ? 0
            : Appointment.countDocuments({
                clinicId,
                appointmentDate: { $gt: availableStart, $lte: end },
                status: 'available',
              }),
          Appointment.countDocuments({ clinicId, appointmentDate: { $gte: start, $lte: end }, status: { $in: ['booked', 'pending_confirmation'] } }),
        ]);
        const totalSlots = await Appointment.countDocuments({
          clinicId,
          appointmentDate: { $gte: start, $lte: end },
          status: { $in: ['available', 'booked', 'pending_confirmation'] },
        });

        return {
          date,
          dayName: dateObj.toLocaleDateString('ar-SA', { weekday: 'long' }),
          displayDate: dateObj.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' }),
          availableCount: available,
          bookedCount: booked,
          hasSlots: totalSlots > 0,
          isClosed,
        };
      })
    );

    let data = daySummaries;
    if (availableOnly) {
      data = daySummaries.filter((d) => !d.isClosed && d.availableCount > 0);
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    جدول ساعات يوم محدد (عام)
exports.getDaySchedule = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'التاريخ مطلوب' });
    }

    const clinic = await Clinic.findOne({ _id: clinicId, isApproved: true, isActive: true });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const closed = await ClosedDay.findOne({ clinicId, date });
    if (closed) {
      return res.json({
        success: true,
        data: { date, hours: [], isClosed: true },
      });
    }

    const { start, end } = getDayBounds(date);
    const appointments = await Appointment.find({
      clinicId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['available', 'booked', 'pending_confirmation'] },
    });

    const forPatient = req.query.view === 'patient';
    const hours = forPatient
      ? buildPatientDaySchedule(date, appointments)
      : buildDaySchedule(date, appointments);

    res.json({
      success: true,
      data: {
        date,
        hours,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    جدول ساعات يوم للعيادة (إدارة)
exports.getClinicDaySchedule = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'التاريخ مطلوب' });
    }

    const closed = await ClosedDay.findOne({ clinicId: req.clinic._id, date });
    const { start, end } = getDayBounds(date);
    const appointments = await Appointment.find({
      clinicId: req.clinic._id,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['available', 'booked', 'pending_confirmation'] },
    });

    res.json({
      success: true,
      data: {
        date,
        hours: buildDaySchedule(date, appointments),
        isClosed: !!closed,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تفعيل/إلغاء ساعة متاحة
exports.toggleScheduleSlot = async (req, res, next) => {
  try {
    const { date, hour } = req.body;

    if (!date || hour === undefined) {
      return res.status(400).json({ success: false, message: 'التاريخ والساعة مطلوبان' });
    }

    if (!WORKING_HOURS.includes(Number(hour))) {
      return res.status(400).json({ success: false, message: 'ساعة غير صالحة' });
    }

    const closed = await ClosedDay.findOne({ clinicId: req.clinic._id, date });
    if (closed) {
      return res.status(400).json({ success: false, message: 'هذا اليوم مغلق ولا يمكن تفعيل الساعات' });
    }

    const appointmentDate = buildDateWithHour(date, Number(hour));
    if (appointmentDate.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'لا يمكن تعديل وقت ماضٍ' });
    }

    const { start, end } = getDayBounds(date);
    const dayAppointments = await Appointment.find({
      clinicId: req.clinic._id,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['available', 'booked', 'pending_confirmation'] },
    });
    const existing = dayAppointments.find((a) =>
      matchAppointmentHour(a.appointmentDate, date, Number(hour))
    );

    if (existing) {
      if (existing.status === 'booked' || existing.status === 'pending_confirmation') {
        return res.status(400).json({ success: false, message: 'هذه الساعة محجوزة ولا يمكن إلغاؤها' });
      }
      await Appointment.findByIdAndDelete(existing._id);
      return res.json({ success: true, message: 'تم إلغاء الساعة', data: { status: 'empty' } });
    }

    const created = await Appointment.create({
      clinicId: req.clinic._id,
      appointmentDate,
      status: 'available',
    });

    res.status(201).json({ success: true, message: 'تم تفعيل الساعة', data: { status: 'available', slot: created } });
  } catch (error) {
    next(error);
  }
};

// @desc    إغلاق/فتح يوم (العيادة)
exports.toggleCloseDay = async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'التاريخ مطلوب' });
    }

    const existing = await ClosedDay.findOne({ clinicId: req.clinic._id, date });
    if (existing) {
      await ClosedDay.deleteOne({ _id: existing._id });
      return res.json({ success: true, message: 'تم فتح اليوم', data: { isClosed: false } });
    }

    await ClosedDay.create({ clinicId: req.clinic._id, date });
    const { start, end } = getDayBounds(date);
    await Appointment.deleteMany({
      clinicId: req.clinic._id,
      appointmentDate: { $gte: start, $lte: end },
      status: 'available',
    });

    res.json({ success: true, message: 'تم إغلاق اليوم', data: { isClosed: true } });
  } catch (error) {
    next(error);
  }
};
exports.getClinicAppointments = async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const query = { clinicId: req.clinic._id, status: { $ne: 'available' } };

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.appointmentDate = { $gte: start, $lt: end };
    }

    const skip = (page - 1) * limit;
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
        .skip(skip)
        .limit(Number(limit))
        .sort({ appointmentDate: -1 }),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض المواعيد المتاحة للعيادة (إدارة)
exports.getClinicAvailableSlots = async (req, res, next) => {
  try {
    const slots = await Appointment.find({
      clinicId: req.clinic._id,
      status: 'available',
      appointmentDate: { $gte: new Date() },
    }).sort({ appointmentDate: 1 });

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @desc    تعديل موعد
exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinic._id,
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }

    const { appointmentDate, status, notes } = req.body;
    const oldDate = appointment.appointmentDate;

    if (appointmentDate) appointment.appointmentDate = new Date(appointmentDate);
    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    if (appointment.patientId && appointmentDate) {
      const patient = await Patient.findById(appointment.patientId);
      if (patient) {
        await createNotification({
          userId: patient.userId,
          title: 'تعديل الموعد',
          message: `تم تعديل موعدك في ${req.clinic.name}`,
          type: 'appointment_updated',
          relatedId: appointment._id,
        });
      }
    }

    res.json({ success: true, message: 'تم تحديث الموعد', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف موعد (متاح أو محجوز)
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      clinicId: req.clinic._id,
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف الموعد' });
  } catch (error) {
    next(error);
  }
};

// @desc    تغيير حالة الموعد
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['booked', 'completed', 'cancelled', 'no_show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinic._id,
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }

    appointment.status = status;
    await appointment.save();

    if (appointment.patientId) {
      const patient = await Patient.findById(appointment.patientId);
      if (patient && status === 'cancelled') {
        await createNotification({
          userId: patient.userId,
          title: 'إلغاء الموعد',
          message: `تم إلغاء موعدك في ${req.clinic.name}`,
          type: 'appointment_cancelled',
          relatedId: appointment._id,
        });
      }
    }

    res.json({ success: true, message: 'تم تحديث حالة الموعد', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    حجز موعد من التطبيق (المريض)
exports.bookAppointment = async (req, res, next) => {
  try {
    const { clinicId, appointmentId, appointmentDate, doctorId, doctorName } = req.body;

    const clinic = await Clinic.findOne({ _id: clinicId, isApproved: true, isActive: true });
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير متاحة' });
    }

    let appointment;

    if (appointmentId) {
      appointment = await Appointment.findOne({
        _id: appointmentId,
        clinicId,
        status: 'available',
      });

      if (!appointment) {
        return res.status(400).json({ success: false, message: 'الموعد غير متاح للحجز' });
      }

      if (isAppointmentInPast(appointment.appointmentDate)) {
        return res.status(400).json({ success: false, message: 'لا يمكن حجز موعد في وقت ماضٍ' });
      }

      const validation = await validatePatientBooking({
        patientId: req.patient._id,
        clinicId,
        appointmentDate: appointment.appointmentDate,
      });

      if (!validation.ok) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      appointment.patientId = req.patient._id;
      appointment.status = 'pending_confirmation';
      appointment.bookingSource = 'app';
      appointment.confirmationRequestedAt = new Date();
      if (doctorId) appointment.doctorId = String(doctorId);
      if (doctorName) appointment.doctorName = doctorName;
      await appointment.save();
    } else if (appointmentDate) {
      const aptDate = new Date(appointmentDate);

      const validation = await validatePatientBooking({
        patientId: req.patient._id,
        clinicId,
        appointmentDate: aptDate,
        doctorId,
      });

      if (!validation.ok) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      appointment = await Appointment.create({
        clinicId,
        patientId: req.patient._id,
        appointmentDate: aptDate,
        status: 'pending_confirmation',
        bookingSource: 'app',
        confirmationRequestedAt: new Date(),
        doctorId: doctorId ? String(doctorId) : null,
        doctorName: doctorName || '',
      });
    } else {
      return res.status(400).json({ success: false, message: 'يجب تحديد موعد' });
    }

    await Patient.findByIdAndUpdate(req.patient._id, { $addToSet: { clinicIds: clinicId } });

    await sendConfirmationMessage(appointment, clinic.userId);

    await createNotification({
      userId: req.user._id,
      title: 'طلب حجز',
      message: `تم إرسال طلب حجزك في ${clinic.name}. يرجى التأكيد عبر المحادثات خلال 12 ساعة.`,
      type: 'appointment_pending',
      relatedId: appointment._id,
    });

    const clinicUser = await User.findById(clinic.userId);
    if (clinicUser) {
      await createNotification({
        userId: clinicUser._id,
        title: 'طلب حجز جديد',
        message: `طلب حجز جديد من ${req.user.name} بانتظار التأكيد`,
        type: 'new_booking',
        relatedId: appointment._id,
      });
    }

    // إشعار للدكتور إذا تم تحديد طبيب
    if (doctorId) {
      const doctor = clinic.doctors?.find(d => String(d._id) === String(doctorId));
      if (doctor) {
        await createNotification({
          userId: clinicUser._id,
          title: `حجز جديد - ${doctor.name}`,
          message: `حجز جديد من ${req.user.name} عند ${doctor.name} - ${new Date(aptDate).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
          type: 'doctor_booking',
          relatedId: appointment._id,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم إرسال طلب الحجز. يرجى التأكيد عبر المحادثات خلال 12 ساعة',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تأكيد موعد (المريض)
exports.confirmAppointmentPatient = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.patient._id,
      status: 'pending_confirmation',
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'طلب الحجز غير موجود' });
    }

    if (appointment.appointmentDate <= new Date()) {
      await releasePendingAppointment(appointment);
      return res.status(400).json({ success: false, message: 'انتهى وقت هذا الموعد' });
    }

    await confirmAppointment(appointment, { patientUserId: req.user._id });
    res.json({ success: true, message: 'تم تأكيد الموعد بنجاح', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    تأكيد موعد (العيادة)
exports.confirmAppointmentClinic = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinic._id,
      status: 'pending_confirmation',
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'طلب الحجز غير موجود' });
    }

    await confirmAppointment(appointment);
    res.json({ success: true, message: 'تم تأكيد الموعد', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    إرسال رسالة تأكيد للمريض (العيادة)
exports.sendConfirmationRequest = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.clinic._id,
      status: 'pending_confirmation',
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'طلب الحجز غير موجود' });
    }

    appointment.confirmationRequestedAt = new Date();
    await appointment.save();
    await sendConfirmationMessage(appointment, req.user._id);

    res.json({ success: true, message: 'تم إرسال طلب التأكيد للمريض' });
  } catch (error) {
    next(error);
  }
};

// @desc    حجز موعد من داخل العيادة
exports.bookFromClinic = async (req, res, next) => {
  try {
    const { patientId, appointmentDate, appointmentId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    }

    let appointment;

    if (appointmentId) {
      appointment = await Appointment.findOne({
        _id: appointmentId,
        clinicId: req.clinic._id,
        status: 'available',
      });

      if (!appointment) {
        return res.status(400).json({ success: false, message: 'الموعد غير متاح' });
      }

      appointment.patientId = patientId;
      appointment.status = 'booked';
      appointment.bookingSource = 'clinic';
      await appointment.save();
    } else {
      appointment = await Appointment.create({
        clinicId: req.clinic._id,
        patientId,
        appointmentDate: new Date(appointmentDate),
        status: 'booked',
        bookingSource: 'clinic',
      });
    }

    await createNotification({
      userId: patient.userId,
      title: 'تأكيد الحجز',
      message: `تم حجز موعد لك في ${req.clinic.name}`,
      type: 'appointment_booked',
      relatedId: appointment._id,
    });

    res.status(201).json({ success: true, message: 'تم حجز الموعد', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل حضور مباشر (walk-in)
exports.walkInAppointment = async (req, res, next) => {
  try {
    const { patientId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    }

    const appointment = await Appointment.create({
      clinicId: req.clinic._id,
      patientId,
      appointmentDate: new Date(),
      status: 'completed',
      bookingSource: 'clinic',
      notes: 'حضور مباشر بدون حجز مسبق',
    });

    res.status(201).json({ success: true, message: 'تم تسجيل الحضور', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    إلغاء موعد (المريض)
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.patient._id,
      status: { $in: ACTIVE_STATUSES },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    }

    if (appointment.status === 'pending_confirmation') {
      await releasePendingAppointment(appointment);
    } else {
      appointment.status = 'cancelled';
      await appointment.save();
    }

    const clinic = await Clinic.findById(appointment.clinicId);
    if (clinic) {
      const clinicUser = await User.findById(clinic.userId);
      if (clinicUser) {
        await createNotification({
          userId: clinicUser._id,
          title: 'إلغاء موعد',
          message: `ألغى ${req.user.name} موعده`,
          type: 'appointment_cancelled',
          relatedId: appointment._id,
        });
      }
    }

    res.json({ success: true, message: 'تم إلغاء الموعد', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    مواعيد المريض
exports.getMyAppointments = async (req, res, next) => {
  try {
    const { status, type = 'all' } = req.query;
    const query = { patientId: req.patient._id };

    if (status) query.status = status;
    if (type === 'upcoming') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ACTIVE_STATUSES };
    } else if (type === 'past') {
      query.appointmentDate = { $lt: new Date() };
    }

    const appointments = await Appointment.find(query)
      .populate('clinicId', 'name address phone specialties')
      .sort({ appointmentDate: -1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};
