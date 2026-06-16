import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, conversationAPI, clinicAPI } from '../../../api/services';
import { useAuth } from '../../../context/AuthContext';
import { useClinicPage } from '../../../context/ClinicPageContext';
import { toast } from '../../../components/Toast';
import LoadingSpinner from '../../../components/LoadingSpinner';
import HourGrid from '../../../components/HourGrid';
import DoctorPicker from '../../../components/DoctorPicker';
import { Calendar, Stethoscope, Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { isSlotPast, isTodayDate, filterPatientHours } from '../../../utils/appointmentSchedule';

export default function ClinicBook() {
  const { clinicId, doctors, selectedDoctor, setSelectedDoctor } = useClinicPage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHours, setLoadingHours] = useState(false);
  const [bookingHour, setBookingHour] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setNow(Date.now());
  }, [selectedDate, hours]);

  useEffect(() => {
    appointmentAPI.getScheduleDays(clinicId, { availableOnly: 'true' })
      .then(({ data }) => {
        const availableDays = data.data;
        setDays(availableDays);
        if (availableDays.length > 0) setSelectedDate(availableDays[0].date);
      })
      .catch(() => setDays([]))
      .finally(() => setLoading(false));

    // جلب معلومات العيادة
    clinicAPI.getById(clinicId)
      .then(({ data }) => setClinicInfo(data.data))
      .catch(() => {});
  }, [clinicId]);

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      setBookedDates([]);
      return;
    }
    appointmentAPI.getMy({ type: 'upcoming' })
      .then(({ data }) => {
        const dates = (data.data || [])
          .filter((a) => String(a.clinicId?._id || a.clinicId) === String(clinicId))
          .map((a) => {
            const d = new Date(a.appointmentDate);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          });
        setBookedDates(dates);
      })
      .catch(() => setBookedDates([]));
  }, [user, clinicId]);

  const bookableDays = useMemo(
    () => days.filter((d) => !bookedDates.includes(d.date)),
    [days, bookedDates]
  );

  useEffect(() => {
    if (bookableDays.length === 0) return;
    const isSelectedBookable = selectedDate && bookableDays.some((d) => d.date === selectedDate);
    if (!isSelectedBookable) setSelectedDate(bookableDays[0].date);
  }, [bookableDays, selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    const loadHours = async () => {
      setLoadingHours(true);
      try {
        const { data } = await appointmentAPI.getDaySchedule(clinicId, selectedDate, { view: 'patient' });
        setHours(data.data.hours);
      } catch {
        setHours([]);
      } finally {
        setLoadingHours(false);
      }
    };
    loadHours();
    const refreshId = setInterval(loadHours, 60000);
    return () => clearInterval(refreshId);
  }, [clinicId, selectedDate]);

  const handleBook = async (slot) => {
    if (!user) return navigate('/login');
    if (user.role !== 'patient') {
      toast.error('يجب تسجيل الدخول كمريض');
      return;
    }
    if (!slot.slotId) return;
    if (slot.slotAt && new Date(slot.slotAt).getTime() <= Date.now()) {
      toast.error('لا يمكن حجز موعد في وقت ماضٍ');
      return;
    }
    if (selectedDate && isTodayDate(selectedDate) && isSlotPast(selectedDate, slot.hour)) {
      toast.error('لا يمكن حجز موعد في وقت ماضٍ');
      return;
    }

    setBookingHour(slot.hour);
    try {
      await appointmentAPI.book({
        clinicId,
        appointmentId: slot.slotId,
        doctorId: selectedDoctor?._id !== 'primary' ? selectedDoctor?._id : null,
        doctorName: selectedDoctor?.name || '',
      });

      // حفظ تفاصيل الحجز لعرضها في صفحة التأكيد
      setBookingDetails({
        date: selectedDate,
        hour: slot.hour,
        doctor: selectedDoctor,
        clinic: clinicInfo,
      });

      setShowConfirmation(true);
      setBookedDates((prev) => (prev.includes(selectedDate) ? prev : [...prev, selectedDate]));
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحجز');
    } finally {
      setBookingHour(null);
    }
  };

  const handleConfirmAndChat = async () => {
    try {
      const { data: conv } = await conversationAPI.startPatient(clinicId);
      navigate(`/patient/chat/${conv.data.data._id}`);
    } catch {
      navigate('/patient/appointments');
    }
  };

  const selectedDay = bookableDays.find((d) => d.date === selectedDate);

  const visibleHours = useMemo(
    () => filterPatientHours(hours, selectedDate, new Date(now)),
    [hours, selectedDate, now]
  );

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  // صفحة تأكيد الحجز
  if (showConfirmation && bookingDetails) {
    const appointmentDate = new Date(`${bookingDetails.date}T${bookingDetails.hour}:00`);
    const timeUntilAppointment = appointmentDate - new Date();
    const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));
    const daysUntil = Math.floor(hoursUntil / 24);

    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">تم إرسال طلب الحجز بنجاح!</h2>
          <p className="text-slate-600">يرجى التأكيد عبر المحادثات خلال 12 ساعة</p>
        </div>

        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6 mb-6 border border-primary-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            تفاصيل الحجز
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">التاريخ</p>
                <p className="font-semibold text-slate-800">
                  {new Date(bookingDetails.date).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">الوقت</p>
                <p className="font-semibold text-slate-800">{bookingDetails.hour}</p>
                {daysUntil > 0 && (
                  <p className="text-sm text-green-600 mt-1">باقي {daysUntil} يوم للحجز</p>
                )}
                {daysUntil === 0 && hoursUntil > 0 && (
                  <p className="text-sm text-green-600 mt-1">باقي {hoursUntil} ساعة للحجز</p>
                )}
              </div>
            </div>

            {bookingDetails.doctor && bookingDetails.doctor._id !== 'primary' && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">الطبيب</p>
                  <p className="font-semibold text-slate-800">{bookingDetails.doctor.name}</p>
                </div>
              </div>
            )}

            {bookingDetails.clinic && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">العيادة</p>
                  <p className="font-semibold text-slate-800">{bookingDetails.clinic.name}</p>
                  {bookingDetails.clinic.address && (
                    <p className="text-sm text-slate-600 mt-1">{bookingDetails.clinic.address}</p>
                  )}
                  {bookingDetails.clinic.phone && (
                    <p className="text-sm text-slate-600 mt-1" dir="ltr">{bookingDetails.clinic.phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>مهم:</strong> يجب تأكيد الحجز عبر المحادثات خلال 12 ساعة، وإلا سيتم إلغاؤه تلقائياً.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConfirmAndChat}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors"
          >
            <span>التأكيد عبر المحادثة</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setShowConfirmation(false);
              navigate('/patient/appointments');
            }}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            لاحقاً
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-primary-600" /> حجز موعد
      </h2>

      {doctors.length > 1 && (
        <div className="mb-6">
          <DoctorPicker
            doctors={doctors}
            selectedId={selectedDoctor?._id}
            onSelect={setSelectedDoctor}
            title="1. اختر الطبيب"
          />
        </div>
      )}

      {selectedDoctor && doctors.length > 1 && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-primary-50 rounded-xl text-sm text-primary-800">
          <Stethoscope className="w-4 h-4" />
          الحجز مع: <span className="font-bold">{selectedDoctor.name}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <p className="text-sm font-semibold text-slate-700 mb-2">{doctors.length > 1 ? '2. اختر اليوم' : '1. اختر اليوم'}</p>
          {bookableDays.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6 bg-slate-50 rounded-xl">
              {days.length === 0 ? 'لا توجد مواعيد متاحة حالياً' : 'لديك موعد محجوز في كل الأيام المتاحة'}
            </p>
          ) : (
            bookableDays.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`w-full text-right p-3 rounded-xl border text-sm transition-all ${
                  selectedDate === day.date
                    ? 'bg-primary-50 border-primary-300 font-semibold'
                    : 'bg-slate-50 border-slate-100 hover:border-primary-200'
                }`}
              >
                <p className="font-bold">{day.dayName}</p>
                <p className="text-slate-500">{day.displayDate}</p>
                <span className="text-xs text-green-600 font-medium">{day.availableCount} موعد متاح</span>
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-slate-700 mb-3">{doctors.length > 1 ? '3. اختر الساعة' : '2. اختر الساعة'}</p>
          {selectedDay && (
            <p className="text-sm text-slate-500 mb-4">{selectedDay.dayName} - {selectedDay.displayDate}</p>
          )}
          {loadingHours ? (
            <LoadingSpinner className="py-12" />
          ) : !selectedDate || bookableDays.length === 0 ? (
            <p className="text-slate-500 text-center py-8">لا توجد ساعات متاحة للحجز</p>
          ) : (
            <HourGrid
              hours={visibleHours}
              mode="patient"
              selectedDate={selectedDate}
              nowMs={now}
              onHourClick={handleBook}
              loadingHour={bookingHour}
            />
          )}
        </div>
      </div>
    </div>
  );
}
