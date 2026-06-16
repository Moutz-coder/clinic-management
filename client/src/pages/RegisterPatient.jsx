import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { Stethoscope, Mail, Lock, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition';

export default function RegisterPatient() {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', birthDate: '', gender: 'male' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerPatient({ ...form, email: form.email.trim().toLowerCase() });
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">حساب مريض جديد</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input className={`${inputCls} pr-11`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input className={`${inputCls} pr-11`} type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@email.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input className={`${inputCls} pr-11`} type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ الميلاد</label>
                <input className={inputCls} type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الجنس</label>
                <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60 flex justify-center">
              {loading ? <LoadingSpinner size="sm" /> : 'إنشاء الحساب'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          لديك حساب؟ <Link to="/login" className="text-primary-600 font-semibold">سجّل دخول</Link>
        </p>
      </div>
    </div>
  );
}
