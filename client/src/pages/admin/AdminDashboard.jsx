import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Building2, Calendar, CheckCircle, XCircle, Clock, Smartphone } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('فشل تحميل الإحصائيات'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">الإحصائيات العامة</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard icon={Users} label="إجمالي المستخدمين" value={stats?.totalUsers} color="primary" to="/admin/users" />
        <StatCard icon={Users} label="المرضى" value={stats?.totalPatients} color="blue" to="/admin/users?role=patient" />
        <StatCard icon={Building2} label="العيادات" value={stats?.totalClinics} color="green" to="/admin/clinics" />
        <StatCard icon={CheckCircle} label="عيادات معتمدة" value={stats?.approvedClinics} color="green" to="/admin/clinics?status=approved" />
        <StatCard icon={Clock} label="بانتظار الموافقة" value={stats?.pendingClinics} color="amber" to="/admin/clinics?status=pending" />
        <StatCard icon={Calendar} label="إجمالي المواعيد" value={stats?.totalAppointments} color="blue" to="/admin/clinics" />
        <StatCard icon={CheckCircle} label="مواعيد مكتملة" value={stats?.completedAppointments} color="green" to="/admin/clinics" />
        <StatCard icon={XCircle} label="مواعيد ملغاة" value={stats?.cancelledAppointments} color="red" to="/admin/clinics" />
        <StatCard icon={Smartphone} label="حجوزات التطبيق" value={stats?.appBookings} color="primary" to="/admin/clinics" />
      </div>
    </div>
  );
}
