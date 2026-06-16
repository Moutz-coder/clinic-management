import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api/services';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Bell, CheckCheck, Trash2, User } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification._id);
    }

    // التنقل إلى صفحة المريض إذا كان الإشعار عن حجز دكتور
    if (notification.type === 'doctor_booking' && notification.relatedId) {
      try {
        const { appointmentAPI } = await import('../api/services');
        const { data } = await appointmentAPI.getMy();
        const appointment = data.data?.find(a => a._id === notification.relatedId);
        if (appointment?.patientId) {
          navigate(`/clinic/patients/${appointment.patientId}`);
          return;
        }
      } catch (error) {
        console.error('Error fetching appointment:', error);
      }
    }

    // التنقل إلى المواعيد للإشعارات الأخرى
    if (notification.type === 'new_booking' || notification.type === 'appointment_pending') {
      navigate('/clinic/appointments?tab=bookings');
    }
  };

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    fetch();
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    toast.success('تم تعليم الكل كمقروء');
    fetch();
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationAPI.delete(id);
      toast.success('تم حذف الإشعار');
      fetch();
    } catch {
      toast.error('فشل حذف الإشعار');
    }
  };

  const deleteAll = async () => {
    if (!confirm('هل تريد حذف جميع الإشعارات؟')) return;
    try {
      await notificationAPI.deleteAll();
      toast.success('تم حذف جميع الإشعارات');
      fetch();
    } catch {
      toast.error('فشل الحذف');
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الإشعارات</h1>
          {unreadCount > 0 && <p className="text-sm text-slate-500">{unreadCount} غير مقروء</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100">
              <CheckCheck className="w-4 h-4" /> تعليم الكل كمقروء
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
              <Trash2 className="w-4 h-4" /> حذف الكل
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد إشعارات" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md cursor-pointer ${
                n.isRead ? 'border-slate-100' : 'border-primary-200 bg-primary-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'doctor_booking' ? 'bg-blue-100' : n.type === 'new_booking' ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    {n.type === 'doctor_booking' ? (
                      <User className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{n.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead && <span className="w-2.5 h-2.5 bg-primary-500 rounded-full" />}
                  <button
                    type="button"
                    onClick={(e) => deleteOne(e, n._id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
