import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clinicAPI, medicalAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { ArrowRight, FileText, Plus, Calendar, Stethoscope, Pill, ClipboardList } from 'lucide-react';
import { formatDateTime, genderLabels } from '../../utils/helpers';

export default function PatientMedicalRecord() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reason: '', diagnosis: '', treatment: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, recsRes] = await Promise.allSettled([
        clinicAPI.getPatient(patientId),
        medicalAPI.getByPatient(patientId),
      ]);
      if (profileRes.status === 'fulfilled') {
        setPatient(profileRes.value.data.data?.patient);
      }
      if (recsRes.status === 'fulfilled') {
        setRecords(recsRes.value.data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const addRecord = async (e) => {
    e.preventDefault();
    if (!form.reason?.trim()) {
      toast.error('سبب الزيارة مطلوب');
      return;
    }
    setSaving(true);
    try {
      const { data } = await medicalAPI.create({ patientId, ...form });
      toast.success('تم إضافة السجل الطبي');
      setRecords((prev) => [data.data, ...prev]);
      setForm({ reason: '', diagnosis: '', treatment: '', notes: '' });
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإضافة');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary-500';

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/clinic/patients" className="text-primary-600 text-sm font-medium hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowRight className="w-4 h-4" /> العودة للمرضى
      </Link>

      <div className="bg-gradient-to-l from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-6 h-6" />
              <h1 className="text-2xl font-bold">السجل الطبي</h1>
            </div>
            <p className="text-primary-100 text-lg font-semibold">{patient?.userId?.name || 'مريض'}</p>
            {patient && (
              <p className="text-primary-200 text-sm mt-1">
                {genderLabels[patient.gender]}
                {patient.birthDate && ` • ${new Date(patient.birthDate).toLocaleDateString('ar-SA')}`}
                {patient.userId?.phone && <> • <span dir="ltr">{patient.userId.phone}</span></>}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'إلغاء' : 'زيارة جديدة'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={addRecord} className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary-600" /> إضافة زيارة جديدة
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">سبب الزيارة *</label>
            <input className={inputCls} placeholder="مثال: فحص دوري، ألم في..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">التشخيص</label>
              <input className={inputCls} placeholder="التشخيص الطبي" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">العلاج</label>
              <input className={inputCls} placeholder="العلاج الموصوف" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ملاحظات</label>
            <textarea className={inputCls} rows={3} placeholder="ملاحظات إضافية..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'جاري الحفظ...' : 'حفظ السجل'}
          </button>
        </form>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800">سجل الزيارات ({records.length})</h2>
        <Link to={`/clinic/patients/${patientId}`} className="text-sm text-primary-600 hover:underline">
          عرض ملف المريض
        </Link>
      </div>

      {records.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد سجلات طبية" description="اضغط على «زيارة جديدة» لإضافة أول سجل" />
      ) : (
        <div className="relative">
          <div className="absolute top-0 bottom-0 right-6 w-0.5 bg-primary-100 hidden sm:block" />
          <div className="space-y-4">
            {records.map((r, i) => (
              <div key={r._id} className="relative sm:pr-14">
                <div className="absolute right-4 top-6 w-4 h-4 bg-primary-500 rounded-full border-4 border-white shadow hidden sm:block z-10" />
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 text-primary-700">
                      <Calendar className="w-4 h-4" />
                      <span className="font-bold">{formatDateTime(r.visitDate)}</span>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">زيارة #{records.length - i}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <Stethoscope className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-medium">سبب الزيارة</p>
                        <p className="text-sm text-slate-800 font-medium">{r.reason}</p>
                      </div>
                    </div>
                    {r.diagnosis && (
                      <div className="flex gap-3">
                        <ClipboardList className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400 font-medium">التشخيص</p>
                          <p className="text-sm text-slate-800">{r.diagnosis}</p>
                        </div>
                      </div>
                    )}
                    {r.treatment && (
                      <div className="flex gap-3">
                        <Pill className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400 font-medium">العلاج</p>
                          <p className="text-sm text-slate-800">{r.treatment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {r.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <p className="text-xs text-slate-400 font-medium mb-1">ملاحظات</p>
                      <p className="text-sm text-slate-600">{r.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
