import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import { Stethoscope, Building2, Hospital, Mail, Lock, MapPin, Phone } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { MEDICAL_CATEGORIES } from '../config/specialtyCategories';
import { facilityNamePlaceholder } from '../utils/facilityLabels';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition';

export default function RegisterClinic() {
  const { registerClinic } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    facilityType: 'private',
    clinicName: '',
    address: '',
    clinicPhone: '',
    description: '',
    specialties: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.clinicName.trim() || !form.name.trim() || !form.email.trim() || !form.password.trim()) {
        toast.error('أكمل الحقول المطلوبة');
        return;
      }
      setStep(2);
      return;
    }

    if (!form.address.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }

    setLoading(true);
    try {
      await registerClinic({
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      toast.success('تم إرسال الطلب! بانتظار موافقة الإدارة');
      navigate('/login?registered=clinic');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">تسجيل عيادة</h1>
          <p className="text-slate-500 text-sm mt-1">خطوة {step} من 2</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
          <div className="flex gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">نوع المنشأة</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'private', l: 'عيادة', icon: Building2 },
                      { k: 'hospital', l: 'مركز', icon: Hospital },
                    ].map((t) => (
                      <button
                        key={t.k}
                        type="button"
                        onClick={() => setForm({ ...form, facilityType: t.k })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition ${
                          form.facilityType === t.k
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <t.icon className="w-4 h-4" /> {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{facilityNamePlaceholder[form.facilityType]}</label>
                  <input className={inputCls} value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">اسم المسؤول</label>
                  <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input className={`${inputCls} pr-11`} type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="clinic@email.com" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input className={`${inputCls} pr-11`} type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">العنوان</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input className={`${inputCls} pr-11`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">هاتف العيادة (اختياري)</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input className={`${inputCls} pr-11`} type="tel" dir="ltr" value={form.clinicPhone} onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })} placeholder="09xxxxxxxx" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">التخصصات</label>
                  <div className="flex flex-wrap gap-2">
                    {MEDICAL_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                      const selected = form.specialties.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            specialties: selected
                              ? form.specialties.filter((s) => s !== cat.id)
                              : [...form.specialties, cat.id],
                          })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                            selected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">وصف مختصر (اختياري)</label>
                  <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50">
                  رجوع
                </button>
              )}
              <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60 flex justify-center">
                {loading ? <LoadingSpinner size="sm" /> : step === 1 ? 'التالي' : 'إرسال الطلب'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          لديك حساب؟ <Link to="/login" className="text-primary-600 font-semibold">سجّل دخول</Link>
        </p>
      </div>
    </div>
  );
}
