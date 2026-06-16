import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: ar });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy - hh:mm a', { locale: ar });
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
};

export const statusLabels = {
  available: { label: 'متاح', color: 'bg-blue-100 text-blue-700' },
  booked: { label: 'محجوز', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'لم يحضر', color: 'bg-slate-100 text-slate-600' },
};

export const bookingSourceLabels = {
  app: 'من التطبيق',
  clinic: 'من العيادة',
};

export const dayLabels = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
};

export const genderLabels = { male: 'ذكر', female: 'أنثى' };

export const roleLabels = { patient: 'مريض', clinic: 'عيادة', admin: 'مدير' };

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
};
