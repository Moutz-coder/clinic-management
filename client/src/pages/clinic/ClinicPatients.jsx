import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clinicAPI, appointmentAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Users, Search, UserPlus } from 'lucide-react';
import { genderLabels } from '../../utils/helpers';

export default function ClinicPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newPatientModal, setNewPatientModal] = useState(false);
  const [bookModal, setBookModal] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '123456', birthDate: '', gender: 'male' });
  const [bookDate, setBookDate] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await clinicAPI.getPatients({ search });
      setPatients(data.data);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const createPatient = async () => {
    try {
      const { data } = await clinicAPI.createPatient(form);
      toast.success('تم إضافة المريض بنجاح');
      setNewPatientModal(false);
      setForm({ name: '', phone: '', password: '123456', birthDate: '', gender: 'male' });
      if (data.data?.patient) {
        setPatients((prev) => {
          const exists = prev.some((p) => p._id === data.data.patient._id);
          if (exists) return prev;
          const patient = { ...data.data.patient, userId: data.data.user };
          return [patient, ...prev];
        });
      }
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإنشاء');
    }
  };

  const bookForPatient = async () => {
    try {
      await appointmentAPI.bookFromClinic({ patientId: bookModal._id, appointmentDate: new Date(bookDate).toISOString() });
      toast.success('تم حجز الموعد');
      setBookModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحجز');
    }
  };

  const walkIn = async (patientId) => {
    try {
      await appointmentAPI.walkIn({ patientId });
      toast.success('تم تسجيل الحضور المباشر');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التسجيل');
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary-500';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">إدارة المرضى</h1>
        <button onClick={() => setNewPatientModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">
          <UserPlus className="w-4 h-4" /> مريض جديد
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetch(); }} className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن مريض..." className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary-500" />
      </form>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : patients.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مرضى" />
      ) : (
        <div className="space-y-4">
          {patients.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Link to={`/clinic/patients/${p._id}`} className="font-bold text-lg text-slate-800 hover:text-primary-700">{p.userId?.name}</Link>
                  <p className="text-sm text-slate-500" dir="ltr">{p.userId?.phone}</p>
                  <p className="text-xs text-slate-400 mt-1">{genderLabels[p.gender]} {p.birthDate && `• ${new Date(p.birthDate).toLocaleDateString('ar-SA')}`}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setBookModal(p)} className="px-3 py-1.5 text-xs bg-primary-100 text-primary-700 rounded-lg font-medium">حجز موعد</button>
                  <button onClick={() => walkIn(p._id)} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg font-medium">حضور مباشر</button>
                  <Link to={`/clinic/patients/${p._id}/medical-record`} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg font-medium">سجل طبي</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={newPatientModal} onClose={() => setNewPatientModal(false)} title="إضافة مريض جديد">
        <div className="space-y-3">
          <input className={inputCls} placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} placeholder="الهاتف" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={inputCls} type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <button onClick={createPatient} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl">إنشاء</button>
        </div>
      </Modal>

      <Modal open={!!bookModal} onClose={() => setBookModal(null)} title={`حجز موعد - ${bookModal?.userId?.name}`}>
        <input type="datetime-local" className={inputCls} value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
        <button onClick={bookForPatient} className="w-full py-3 mt-4 bg-primary-600 text-white font-bold rounded-xl">حجز</button>
      </Modal>
    </div>
  );
}
