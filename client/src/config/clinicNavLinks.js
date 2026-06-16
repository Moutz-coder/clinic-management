import { Home, Calendar, Clock, MessageCircle } from 'lucide-react';

export const getClinicNavLinks = (id) => [
  { to: `/clinics/${id}`, label: 'الرئيسية', icon: Home, end: true },
  { to: `/clinics/${id}/book`, label: 'حجز موعد', icon: Calendar },
  { to: `/clinics/${id}/hours`, label: 'ساعات العمل', icon: Clock },
  { to: `/clinics/${id}/contact`, label: 'تواصل', icon: MessageCircle },
];
