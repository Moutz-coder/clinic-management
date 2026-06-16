const WORKING_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatHourLabel = (hour) => {
  if (hour === 12) return '12:00 م';
  if (hour === 24) return '12:00 ص';
  if (hour > 12) return `${hour - 12}:00 م`;
  return `${hour}:00 ص`;
};

const buildDateWithHour = (dateStr, hour) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (hour === 24) {
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  return new Date(y, m - 1, d, hour, 0, 0, 0);
};

const getDayBounds = (dateStr) => {
  const start = buildDateWithHour(dateStr, 0);
  start.setMinutes(0, 0, 0);
  const end = buildDateWithHour(dateStr, 24);
  return { start, end };
};

const getNextDays = (count = 14) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = formatLocalDate(d);
    days.push({ date: dateStr, dateObj: d });
  }
  return days;
};

// من اليوم حتى نهاية الشهر الحالي + الشهر التالي (تتجدد تلقائياً كل شهر)
const getScheduleMonthDays = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const d = new Date(today);
  while (d <= endDate) {
    days.push({ date: formatLocalDate(d), dateObj: new Date(d) });
    d.setDate(d.getDate() + 1);
  }
  return days;
};

const matchAppointmentHour = (appointmentDate, dateStr, hour) => {
  const apt = new Date(appointmentDate);
  const slot = buildDateWithHour(dateStr, hour);
  return (
    apt.getFullYear() === slot.getFullYear() &&
    apt.getMonth() === slot.getMonth() &&
    apt.getDate() === slot.getDate() &&
    apt.getHours() === slot.getHours()
  );
};

const isSlotPast = (dateStr, hour, now = new Date()) => {
  if (!dateStr || hour == null) return false;

  const todayStr = formatLocalDate(now);
  const slotStart = buildDateWithHour(dateStr, hour);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotStart.getHours() + 1, 0, 0, 0);

  if (dateStr !== todayStr) {
    return now.getTime() > slotStart.getTime();
  }

  return now.getTime() >= slotEnd.getTime();
};

const isAppointmentInPast = (appointmentDate, now = new Date()) =>
  new Date(appointmentDate).getTime() <= now.getTime();

const buildDaySchedule = (dateStr, appointments, now = new Date()) => {
  return WORKING_HOURS.map((hour) => {
    const slot = appointments.find((a) => matchAppointmentHour(a.appointmentDate, dateStr, hour));
    const slotDate = buildDateWithHour(dateStr, hour);
    const isPast = isSlotPast(dateStr, hour, now);

    let status = 'empty';
    if (slot) {
      status = ['booked', 'pending_confirmation'].includes(slot.status) ? 'booked' : 'available';
    }
    if (isPast && status !== 'booked') status = 'past';

    return {
      hour,
      label: formatHourLabel(hour),
      status,
      slotId: slot?._id || null,
      isPast,
      slotAt: slotDate.toISOString(),
    };
  });
};

const buildPatientDaySchedule = (dateStr, appointments, now = new Date()) => {
  const todayStr = formatLocalDate(now);
  return buildDaySchedule(dateStr, appointments, now).filter((h) => {
    if (h.status !== 'available') return false;

    const slotStart = buildDateWithHour(dateStr, h.hour);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotStart.getHours() + 1, 0, 0, 0);

    if (dateStr === todayStr) {
      return now.getTime() < slotEnd.getTime();
    }

    return slotStart.getTime() > now.getTime();
  });
};

module.exports = {
  WORKING_HOURS,
  formatHourLabel,
  formatLocalDate,
  buildDateWithHour,
  matchAppointmentHour,
  getDayBounds,
  getNextDays,
  getScheduleMonthDays,
  buildDaySchedule,
  buildPatientDaySchedule,
  isSlotPast,
  isAppointmentInPast,
};
