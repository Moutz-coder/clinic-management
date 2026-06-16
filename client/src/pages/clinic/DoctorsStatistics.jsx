import { useState, useEffect } from 'react';
import { clinicAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Calendar, CheckCircle, XCircle, Clock, Star, TrendingUp } from 'lucide-react';

export default function DoctorsStatistics() {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      try {
        const { data } = await clinicAPI.getDoctorsStatistics();
        setStatistics(data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'فشل تحميل الإحصائيات');
      } finally {
        setLoading(false);
      }
    };
    loadStatistics();
  }, []);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  if (statistics.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">لا يوجد أطباء في العيادة</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary-600" />
        إحصائيات الأطباء
      </h1>

      <div className="grid gap-4">
        {statistics.map((stat) => (
          <div key={stat.doctorId} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{stat.doctorName}</h3>
                <p className="text-sm text-slate-500">{stat.specialty || 'طبيب عام'}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-amber-700">{stat.rating.toFixed(1)}</span>
                <span className="text-xs text-amber-600">({stat.ratingCount})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{stat.totalAppointments}</p>
                <p className="text-xs text-blue-600">إجمالي الحجوزات</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{stat.completedAppointments}</p>
                <p className="text-xs text-green-600">مكتملة</p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{stat.cancelledAppointments}</p>
                <p className="text-xs text-red-600">ملغاة</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{stat.pendingAppointments}</p>
                <p className="text-xs text-purple-600">قيد الانتظار</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">عدد المرضى الفريدين:</span>
                </div>
                <span className="text-lg font-bold text-slate-800">{stat.uniquePatients}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
