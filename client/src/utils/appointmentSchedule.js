export const HOUR_STATUS = {
  empty: {
    label: 'غير مفعّل',
    clinicClass: 'bg-slate-100 text-slate-400 border-slate-200 cursor-pointer hover:bg-slate-200',
    patientClass: 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed',
  },
  available: {
    label: 'متاح',
    clinicClass: 'bg-green-100 text-green-800 border-green-300 cursor-pointer hover:bg-green-200 ring-2 ring-green-400',
    patientClass: 'bg-green-50 text-green-700 border-green-300 cursor-pointer hover:bg-green-100 hover:ring-2 hover:ring-green-400',
  },
  booked: {
    label: 'محجوز',
    clinicClass: 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed opacity-80',
    patientClass: 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed line-through',
  },
  past: {
    label: 'انتهى',
    clinicClass: 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed',
    patientClass: 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed',
  },
};

export const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const buildSlotDate = (dateStr, hour) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (hour === 24) {
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  return new Date(y, m - 1, d, hour, 0, 0, 0);
};

export const isTodayDate = (dateStr) => dateStr === formatLocalDate(new Date());

/** الموعد في الماضي — تُخفى الساعة بعد انتهائها (عند 5:00 م تظهر ساعة 5:00 م) */
export const isSlotPast = (dateStr, hour, now = new Date()) => {
  if (!dateStr || hour == null) return false;

  const slotStart = buildSlotDate(dateStr, hour);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotStart.getHours() + 1, 0, 0, 0);

  if (dateStr !== formatLocalDate(now)) {
    return now.getTime() > slotStart.getTime();
  }

  return now.getTime() >= slotEnd.getTime();
};

/** للمريض: إظهار المواعيد المتاحة التي لم يمر وقتها بعد */
export const isPatientSlotVisible = (slot, selectedDate, now = new Date()) => {
  if (!slot || slot.status !== 'available' || !selectedDate || slot.hour == null) {
    return false;
  }

  const slotStart = buildSlotDate(selectedDate, slot.hour);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotStart.getHours() + 1, 0, 0, 0);

  if (isTodayDate(selectedDate)) {
    return now.getTime() < slotEnd.getTime();
  }

  return slotStart.getTime() > now.getTime();
};

export const filterPatientHours = (hours, selectedDate, now = new Date()) =>
  (hours || []).filter((slot) => isPatientSlotVisible(slot, selectedDate, now));

