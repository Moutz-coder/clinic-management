import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clinicAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Clock, Save, ArrowRight } from 'lucide-react';
import { dayLabels } from '../../utils/helpers';

const defaultDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function DoctorWorkingDays() {
  const { doctorId } = useParams();
  const [workingDays, setWorkingDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    const loadDoctorData = async () => {
      setLoading(true);
      try {
        const { data } = await clinicAPI.getDoctorsStatistics();
        const doctor = data.data?.find(d => d.doctorId === doctorId);
        if (doctor) {
          setDoctorName(doctor.doctorName);
        }
      } catch (err) {
        console.error('Error loading doctor data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDoctorData();

    setWorkingDays({
      sunday: { isOpen: true, open: '09:00', close: '17:00' },
      monday: { isOpen: true, open: '09:00', close: '17:00' },
      tuesday: { isOpen: true, open: '09:00', close: '17:00' },
      wednesday: { isOpen: true, open: '09:00', close: '17:00' },
      thursday: { isOpen: true, open: '09:00', close: '17:00' },
      friday: { isOpen: false, open: '09:00', close: '17:00' },
      saturday: { isOpen: false, open: '09:00', close: '17:00' },
    });
  }, [doctorId]);

  const updateDay = (day, field, value) => {
    setWorkingDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const saveWorkingDays = async () => {
    setSaving(true);
    try {
      await clinicAPI.updateDoctorWorkingDays(doctorId, workingDays);
      toast.success('تم حفظ أوقات دوام الطبيب');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <button className="text-primary-600 hover:underline text-sm">الأطباء</button>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-800">أوقات دوام الطبيب</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{doctorName || 'الطبيب'}</h2>
          <p className="text-sm text-slate-500 mt-1">حدد الأيام والساعات التي يداوم فيها الطبيب</p>
        </div>

        <div className="space-y-3">
          {defaultDays.map((day) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-800 sm:w-24">{dayLabels[day]}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workingDays[day]?.isOpen || false}
                  onChange={(e) => updateDay(day, 'isOpen', e.target.checked)}
                  className="rounded accent-primary-600"
                />
                مفتوح
              </label>
              {workingDays[day]?.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={workingDays[day]?.open || '09:00'}
                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="time"
                    value={workingDays[day]?.close || '17:00'}
                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              ) : (
                <span className="text-red-500 text-sm font-medium">مغلق</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={saveWorkingDays}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <LoadingSpinner size="sm" /> : <Clock className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : 'حفظ أوقات الدوام'}
          </button>
        </div>
      </div>
    </div>
  );
}
