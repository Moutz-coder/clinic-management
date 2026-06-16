const Appointment = require('../models/Appointment');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');
const { getDayBounds, formatLocalDate, isAppointmentInPast } = require('./schedule');
const { createNotification } = require('./helpers');

const ACTIVE_STATUSES = ['booked', 'pending_confirmation'];
const MAX_FUTURE_BOOKINGS = 3;
const CONFIRMATION_HOURS = 12;

const validatePatientBooking = async ({ patientId, clinicId, appointmentDate, doctorId }) => {
  const now = new Date();

  if (isAppointmentInPast(appointmentDate, now)) {
    return { ok: false, message: 'لا يمكن حجز موعد في وقت ماضٍ' };
  }

  const aptDate = new Date(appointmentDate);

  const futureCount = await Appointment.countDocuments({
    patientId,
    status: { $in: ACTIVE_STATUSES },
    appointmentDate: { $gte: now },
  });

  if (futureCount >= MAX_FUTURE_BOOKINGS) {
    return { ok: false, message: 'لا يمكنك الحصول على أكثر من 3 حجوزات مستقبلية' };
  }

  const { start, end } = getDayBounds(formatLocalDate(aptDate));

  // التحقق من الحجز عند نفس الطبيب في نفس اليوم
  if (doctorId) {
    const existingSameDoctor = await Appointment.findOne({
      patientId,
      doctorId,
      status: { $in: ACTIVE_STATUSES },
      appointmentDate: { $gte: start, $lte: end },
    });

    if (existingSameDoctor) {
      return { ok: false, message: 'لديك موعد محجوز بالفعل في هذا اليوم عند هذا الطبيب' };
    }
  }

  // التحقق من الحجز عند نفس العيادة في نفس اليوم (بدون طبيب محدد)
  if (!doctorId) {
    const existingSameClinic = await Appointment.findOne({
      clinicId,
      patientId,
      status: { $in: ACTIVE_STATUSES },
      appointmentDate: { $gte: start, $lte: end },
    });

    if (existingSameClinic) {
      return { ok: false, message: 'لديك موعد محجوز بالفعل في هذا اليوم لهذه العيادة' };
    }
  }

  return { ok: true };
};

const sendConfirmationMessage = async (appointment, clinicUserId) => {
  const conversation = await Conversation.findOne({
    patientId: appointment.patientId,
    clinicId: appointment.clinicId,
  });

  let conv = conversation;
  if (!conv) {
    conv = await Conversation.create({
      patientId: appointment.patientId,
      clinicId: appointment.clinicId,
    });
  }

  const dateStr = new Date(appointment.appointmentDate).toLocaleString('ar-SA');
  const text =
    `طلب حجز موعد بتاريخ ${dateStr}.\n` +
    `يرجى الرد بكلمة "تأكيد" لتأكيد الموعد خلال ${CONFIRMATION_HOURS} ساعة، وإلا سيتم إلغاء الحجز تلقائياً.`;

  await Message.create({
    conversationId: conv._id,
    senderId: clinicUserId,
    message: text,
    appointmentId: appointment._id,
    type: 'appointment_confirmation',
  });

  conv.lastMessageAt = new Date();
  await conv.save();

  const patient = await Patient.findById(appointment.patientId);
  if (patient?.userId) {
    await createNotification({
      userId: patient.userId,
      title: 'تأكيد الموعد مطلوب',
      message: `لديك طلب حجز بانتظار التأكيد في العيادة. راجع المحادثات.`,
      type: 'appointment_pending',
      relatedId: appointment._id,
    });
  }
};

const confirmAppointment = async (appointment, { patientUserId } = {}) => {
  appointment.status = 'booked';
  appointment.confirmedAt = new Date();
  await appointment.save();

  const clinic = await Clinic.findById(appointment.clinicId);
  const patient = await Patient.findById(appointment.patientId).populate('userId', 'name');

  const conv = await Conversation.findOne({
    patientId: appointment.patientId,
    clinicId: appointment.clinicId,
  });

  if (conv && patientUserId) {
    const dateStr = new Date(appointment.appointmentDate).toLocaleString('ar-SA');
    await Message.create({
      conversationId: conv._id,
      senderId: patientUserId,
      message: `✅ تم تأكيد الموعد بنجاح!\n\nشكراً لك، موعدك محجوز بتاريخ:\n${dateStr}\n\nنتطلع لرؤيتك في العيادة.`,
      type: 'appointment_confirmed',
      appointmentId: appointment._id,
    });
    conv.lastMessageAt = new Date();
    await conv.save();
  }

  if (patient?.userId) {
    await createNotification({
      userId: patient.userId,
      title: 'تم تأكيد الموعد',
      message: `تم تأكيد موعدك في ${clinic?.name || 'العيادة'}`,
      type: 'appointment_booked',
      relatedId: appointment._id,
    });
  }

  return appointment;
};

const releasePendingAppointment = async (appointment) => {
  appointment.status = 'available';
  appointment.patientId = null;
  appointment.bookingSource = null;
  appointment.confirmationRequestedAt = null;
  appointment.confirmedAt = null;
  await appointment.save();
};

const tryConfirmFromChatMessage = async (conversation, patientId, messageText, patientUserId) => {
  const normalized = (messageText || '').trim().toLowerCase();
  if (!['تأكيد', 'تاكيد', 'confirm', 'نعم'].includes(normalized)) return null;

  const pending = await Appointment.findOne({
    patientId,
    clinicId: conversation.clinicId,
    status: 'pending_confirmation',
    appointmentDate: { $gte: new Date() },
  }).sort({ confirmationRequestedAt: -1 });

  if (!pending) return null;
  return confirmAppointment(pending, { patientUserId });
};

const expirePendingAppointments = async () => {
  const cutoff = new Date(Date.now() - CONFIRMATION_HOURS * 60 * 60 * 1000);
  const expired = await Appointment.find({
    status: 'pending_confirmation',
    confirmationRequestedAt: { $lte: cutoff },
  });

  for (const apt of expired) {
    const patient = await Patient.findById(apt.patientId);
    await releasePendingAppointment(apt);

    if (patient?.userId) {
      const clinic = await Clinic.findById(apt.clinicId);
      await createNotification({
        userId: patient.userId,
        title: 'إلغاء الموعد',
        message: `تم إلغاء طلب الحجز في ${clinic?.name || 'العيادة'} لعدم التأكيد خلال ${CONFIRMATION_HOURS} ساعة`,
        type: 'appointment_cancelled',
        relatedId: apt._id,
      });
    }
  }

  return expired.length;
};

module.exports = {
  ACTIVE_STATUSES,
  MAX_FUTURE_BOOKINGS,
  CONFIRMATION_HOURS,
  validatePatientBooking,
  sendConfirmationMessage,
  confirmAppointment,
  releasePendingAppointment,
  tryConfirmFromChatMessage,
  expirePendingAppointments,
};
