import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Calendar, MapPin, Clock, MessageCircle, X, Building2 } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const { data } = await appointmentAPI.getMy(params);
      setAppointments(data.data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleCancel = async (id) => {
    if (!confirm('هل أنت متأكد من إلغاء الموعد؟')) return;
    try {
      await appointmentAPI.cancel(id);
      toast.success('تم إلغاء الموعد');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإلغاء');
    }
  };

  const tabs = [
    { key: 'all', label: 'الكل' },
    { key: 'upcoming', label: 'القادمة' },
    { key: 'past', label: 'السابقة' },
  ];

  const canCancel = (status) => ['booked', 'pending_confirmation'].includes(status);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">مواعيدي</h1>
        <p className="text-slate-500 text-sm mt-1">تابع مواعيدك وإدارتها بسهولة</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === t.key
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : appointments.length === 0 ? (
        <>
          <EmptyState icon={Calendar} title="لا توجد مواعيد" description="تصفح العيادات واحجز موعدك الأول" />
          <div className="text-center -mt-8 mb-8">
            <Link to="/clinics" className="inline-block px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">
              تصفح العيادات
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-28 bg-gradient-to-b from-primary-500 to-primary-700 flex sm:flex-col items-center justify-center gap-2 p-4 text-white shrink-0">
                  <Calendar className="w-6 h-6 opacity-80" />
                  <div className="text-center">
                    <p className="text-lg font-bold leading-tight">
                      {new Date(apt.appointmentDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm opacity-90">
                      {new Date(apt.appointmentDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{apt.clinicId?.name || 'عيادة'}</h3>
                      {apt.clinicId?.address && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {apt.clinicId.address}
                        </p>
                      )}
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {formatDateTime(apt.appointmentDate)}
                      </p>
                      {apt.status === 'pending_confirmation' && (
                        <Link to="/patient/chat" className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium hover:bg-amber-100">
                          <MessageCircle className="w-3.5 h-3.5" /> أكّد من المحادثات
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <StatusBadge status={apt.status} />
                    {canCancel(apt.status) && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
                      >
                        <X className="w-4 h-4" /> إلغاء
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
