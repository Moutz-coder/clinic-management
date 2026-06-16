import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, medicalAPI } from '../api/services';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { genderLabels, formatDateTime } from '../utils/helpers';
import { facilityLabels } from '../utils/facilityLabels';
import { FileText, Pill, Stethoscope } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: profile?.birthDate ? profile.birthDate.split('T')[0] : '',
    gender: profile?.gender || 'male',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none';

  useEffect(() => {
    if (user?.role !== 'patient') return;
    setLoadingRecords(true);
    medicalAPI.getMy()
      .then(({ data }) => setRecords(data.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false));
  }, [user?.role]);

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(form);
      await refreshUser();
      toast.success('تم تحديث الملف الشخصي');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.changePassword(passwords);
      toast.success('تم تغيير كلمة المرور');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">الملف الشخصي</h1>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-500 text-sm" dir="ltr">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input className={inputCls} type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف (اختياري)</label>
            <input className={inputCls} dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {user?.role === 'patient' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ الميلاد</label>
                <input className={inputCls} type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الجنس</label>
                <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  {Object.entries(genderLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60">
            {loading ? <LoadingSpinner size="sm" /> : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      {user?.role === 'patient' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" /> سجلي الطبي
          </h3>
          <p className="text-sm text-slate-500 mb-4">جميع الزيارات والوصفات من العيادات التي زرتها</p>

          {loadingRecords ? (
            <LoadingSpinner className="py-8" />
          ) : records.length === 0 ? (
            <EmptyState icon={FileText} title="لا توجد سجلات طبية بعد" description="ستظهر هنا عند زيارتك لأي عيادة" />
          ) : (
            <div className="space-y-4">
              {records.map((r) => (
                <div key={r._id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-slate-800">{r.clinicId?.name || 'عيادة'}</p>
                      <p className="text-xs text-slate-500">{facilityLabels[r.clinicId?.facilityType] || 'عيادة'}</p>
                    </div>
                    <p className="text-sm text-primary-700 font-medium shrink-0">{formatDateTime(r.visitDate)}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500">سبب الزيارة:</span> {r.reason}</p>
                    {r.diagnosis && (
                      <p className="flex items-start gap-2">
                        <Stethoscope className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <span><span className="text-slate-500">التشخيص:</span> {r.diagnosis}</span>
                      </p>
                    )}
                    {r.treatment && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3 mt-2">
                        <p className="flex items-center gap-2 font-semibold text-green-800 text-xs mb-1">
                          <Pill className="w-4 h-4" /> الوصفة الطبية
                        </p>
                        <p className="text-green-700">{r.treatment}</p>
                      </div>
                    )}
                    {r.notes && <p className="text-slate-500 text-xs mt-1">ملاحظات: {r.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold text-lg mb-4">تغيير كلمة المرور</h3>
        <form onSubmit={handlePassword} className="space-y-4">
          <input className={inputCls} type="password" placeholder="كلمة المرور الحالية" dir="ltr" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          <input className={inputCls} type="password" placeholder="كلمة المرور الجديدة" dir="ltr" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 disabled:opacity-60">تغيير كلمة المرور</button>
        </form>
      </div>
    </div>
  );
}
