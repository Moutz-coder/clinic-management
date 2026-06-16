import { useState, useEffect } from 'react';
import { clinicAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Calendar, CheckCircle, XCircle, Clock, Smartphone, Building } from 'lucide-react';

export default function ClinicDashboard() {
  const { profile, activeDoctor, isDoctorSession } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicAPI.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم</h1>
        <p className="text-slate-500">
          {isDoctorSession && activeDoctor ? `${activeDoctor.name} — ${profile?.name}` : profile?.name}
        </p>
        {!profile?.isApproved && (
          <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            عيادتك في انتظار موافقة الإدارة.
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard icon={Users} label="إجمالي المرضى" value={stats?.totalPatients} color="primary" to="/clinic/patients" />
        <StatCard icon={Calendar} label="إجمالي المواعيد" value={stats?.totalAppointments} color="blue" to="/clinic/appointments?tab=bookings" />
        <StatCard icon={CheckCircle} label="مواعيد مكتملة" value={stats?.completedAppointments} color="green" to="/clinic/appointments?tab=bookings&status=completed" />
        <StatCard icon={XCircle} label="مواعيد ملغاة" value={stats?.cancelledAppointments} color="red" to="/clinic/appointments?tab=bookings&status=cancelled" />
        <StatCard icon={Clock} label="حجوزات قادمة" value={stats?.upcomingBookings} color="amber" to="/clinic/appointments?tab=bookings&status=booked" />
        <StatCard icon={Users} label="مرضى جدد هذا الشهر" value={stats?.newPatientsThisMonth} color="purple" to="/clinic/patients" />
        <StatCard icon={Calendar} label="زيارات شهرية" value={stats?.monthlyVisits} color="blue" to="/clinic/appointments?tab=bookings" />
        <StatCard icon={Smartphone} label="حجوزات من التطبيق" value={stats?.appBookings} color="primary" to="/clinic/appointments?tab=bookings" />
        <StatCard icon={Building} label="حجوزات من العيادة" value={stats?.clinicBookings} color="green" to="/clinic/appointments?tab=bookings" />
      </div>
    </div>
  );
}
