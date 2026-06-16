import { Home, Building2, Calendar, MessageCircle, Bell, User, Stethoscope, FileText, TrendingUp, Clock } from 'lucide-react';

export const patientLinks = [
  { to: '/clinics', label: 'العيادات', icon: Building2, end: true },
  { to: '/patient/consultations', label: 'استشارات', icon: Stethoscope },
  { to: '/patient/appointments', label: 'مواعيدي', icon: Calendar },
  { to: '/patient/chat', label: 'المحادثات', icon: MessageCircle },
  { to: '/patient/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/patient/profile', label: 'حسابي', icon: User },
];

export const clinicLinks = [
  { to: '/clinic/dashboard', label: 'لوحة التحكم', icon: Home },
  { to: '/clinic/appointments', label: 'المواعيد', icon: Calendar },
  { to: '/clinic/patients', label: 'المرضى', icon: User },
  { to: '/clinic/doctors/statistics', label: 'إحصائيات الأطباء', icon: TrendingUp },
  { to: '/clinic/chat', label: 'المحادثات', icon: MessageCircle },
  { to: '/clinic/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/clinic/settings', label: 'الإعدادات', icon: Building2 },
];

export const adminLinks = [
  { to: '/admin/dashboard', label: 'الإحصائيات', icon: Home },
  { to: '/admin/clinics', label: 'العيادات', icon: Building2 },
  { to: '/admin/users', label: 'المستخدمين', icon: User },
  { to: '/admin/medical-records', label: 'السجلات الطبية', icon: FileText },
];
