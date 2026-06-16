import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appointmentAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import HourGrid from '../../components/HourGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Calendar } from 'lucide-react';
import { formatDateTime, bookingSourceLabels } from '../../utils/helpers';

export default function ClinicAppointments() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'schedule');
  const [appointments, setAppointments] = useState([]);
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hours, setHours] = useState([]);
  const [dayClosed, setDayClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHours, setLoadingHours] = useState(false);
  const [loadingHour, setLoadingHour] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const clinicId = profile?._id;

  const fetchBookings = async () => {
    try {
      const { data } = await appointmentAPI.getClinic(statusFilter ? { status: statusFilter } : {});
      setAppointments(data.data);
    } catch {
      setAppointments([]);
    }
  };

  const fetchDays = async () => {
    if (!clinicId) return;
    try {
      const { data } = await appointmentAPI.getScheduleDays(clinicId);
      setDays(data.data);
      if (!selectedDate && data.data.length > 0) {
        setSelectedDate(data.data[0].date);
      }
    } catch {
      setDays([]);
    }
  };

  const fetchHours = async (date) => {
    if (!date) return;
    setLoadingHours(true);
    try {
      const { data } = await appointmentAPI.getClinicDaySchedule(date);
      setHours(data.data.hours);
      setDayClosed(!!data.data.isClosed);
    } catch {
      setHours([]);
    } finally {
      setLoadingHours(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchDays()]);
      setLoading(false);
    };
    load();
  }, [clinicId, statusFilter]);

  useEffect(() => {
    if (selectedDate) fetchHours(selectedDate);
  }, [selectedDate]);

  const toggleHour = async (slot) => {
    setLoadingHour(slot.hour);
    try {
      await appointmentAPI.toggleScheduleSlot(selectedDate, slot.hour);
      toast.success(slot.status === 'available' ? 'تم إلغاء الساعة' : 'تم تفعيل الساعة');
      await fetchHours(selectedDate);
      await fetchDays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    } finally {
      setLoadingHour(null);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, status);
      toast.success('تم تحديث الحالة');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const confirmBooking = async (id) => {
    try {
      await appointmentAPI.confirmClinic(id);
      toast.success('تم تأكيد الموعد');
      fetchBookings();
      if (selectedDate) fetchHours(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التأكيد');
    }
  };

  const sendConfirmation = async (id) => {
    try {
      await appointmentAPI.sendConfirmation(id);
      toast.success('تم إرسال طلب التأكيد للمريض');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإرسال');
    }
  };

  const toggleCloseDay = async () => {
    if (!selectedDate) return;
    try {
      const { data } = await appointmentAPI.toggleCloseDay(selectedDate);
      toast.success(data.message);
      await fetchDays();
      await fetchHours(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const selectedDay = days.find((d) => d.date === selectedDate);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">إدارة المواعيد</h1>

      <div className="flex gap-2 mb-6">
        {[
          { k: 'schedule', l: 'جدول المواعيد' },
          { k: 'bookings', l: 'الحجوزات' },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.k ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : tab === 'schedule' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-4">
            <h2 className="font-bold text-slate-800 mb-4">اختر اليوم</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {days.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`w-full text-right p-4 rounded-xl border transition-all ${
                    day.isClosed
                      ? selectedDate === day.date
                        ? 'bg-red-50 border-red-400 ring-2 ring-red-200'
                        : 'bg-red-50/60 border-red-200 hover:border-red-300'
                      : selectedDate === day.date
                        ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-200'
                        : 'bg-slate-50 border-slate-100 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{day.dayName}</p>
                    {day.isClosed && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">مغلق</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{day.displayDate}</p>
                  <div className="flex gap-2 mt-2 text-xs flex-wrap">
                    {day.isClosed ? (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">لا يمكن الحجز</span>
                    ) : (
                      <>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{day.availableCount} متاح</span>
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{day.bookedCount} محجوز</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
            {selectedDay ? (
              <>
                <h2 className="font-bold text-lg mb-2">
                  ساعات يوم {selectedDay.dayName} - {selectedDay.displayDate}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <p className="text-sm text-slate-500">
                    اضغط على الساعة لتفعيلها (أخضر) أو إلغائها. الساعات المحجوزة تظهر بالأحمر.
                  </p>
                  <button
                    type="button"
                    onClick={toggleCloseDay}
                    className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 ${
                      dayClosed || selectedDay?.isClosed
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {dayClosed || selectedDay?.isClosed ? 'فتح اليوم' : 'إغلاق اليوم'}
                  </button>
                </div>
                {dayClosed || selectedDay?.isClosed ? (
                  <div className="text-center py-12 bg-red-50 rounded-xl border-2 border-red-200 border-dashed">
                    <p className="text-red-600 font-bold text-lg mb-1">🔒 هذا اليوم مغلق</p>
                    <p className="text-red-500/80 text-sm">لا يمكن للمرضى الحجز في هذا اليوم</p>
                  </div>
                ) : loadingHours ? (
                  <LoadingSpinner className="py-12" />
                ) : (
                  <HourGrid hours={hours} mode="clinic" onHourClick={toggleHour} loadingHour={loadingHour} />
                )}
              </>
            ) : (
              <EmptyState icon={Calendar} title="اختر يوماً" description="اختر يوماً من القائمة لإدارة الساعات" />
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'pending_confirmation', 'booked', 'completed', 'cancelled', 'no_show'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {s === '' ? 'الكل' : s === 'pending_confirmation' ? 'بانتظار التأكيد' : s === 'booked' ? 'محجوز' : s === 'completed' ? 'مكتمل' : s === 'cancelled' ? 'ملغي' : 'لم يحضر'}
              </button>
            ))}
          </div>
          {appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="لا توجد حجوزات" />
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt._id} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{apt.patientId?.userId?.name || 'مريض'}</h3>
                      <p className="text-sm text-slate-500" dir="ltr">{apt.patientId?.userId?.phone}</p>
                      <p className="text-sm text-primary-700 font-medium mt-1">{formatDateTime(apt.appointmentDate)}</p>
                      <p className="text-xs text-slate-400 mt-1">المصدر: {bookingSourceLabels[apt.bookingSource] || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={apt.status} />
                      {apt.status === 'pending_confirmation' && (
                        <>
                          <button onClick={() => confirmBooking(apt._id)} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg font-medium">تأكيد</button>
                          <button onClick={() => sendConfirmation(apt._id)} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg font-medium">إرسال تأكيد</button>
                        </>
                      )}
                      {apt.status === 'booked' && (
                        <>
                          <button onClick={() => updateStatus(apt._id, 'completed')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg font-medium">مكتمل</button>
                          <button onClick={() => updateStatus(apt._id, 'no_show')} className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg font-medium">لم يحضر</button>
                          <button onClick={() => updateStatus(apt._id, 'cancelled')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg font-medium">إلغاء</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
