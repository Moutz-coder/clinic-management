import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import { ArrowRight, Building2, Hospital } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MEDICAL_CATEGORIES } from '../../config/specialtyCategories';
import { facilityNamePlaceholder } from '../../utils/facilityLabels';

const emptyForm = {
  name: '', email: '', password: '', facilityType: 'private', clinicName: '', description: '', address: '', clinicPhone: '', specialties: [],
};

export default function AdminCreateClinic() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.createClinic({
        ...form,
        specialties: form.specialties,
      });
      toast.success('تم إنشاء العيادة بنجاح! يمكنك إنشاء عيادة أخرى');
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إنشاء العيادة');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-2xl">
      <Link to="/admin/clinics" className="text-primary-600 text-sm font-medium hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowRight className="w-4 h-4" /> العودة لقائمة العيادات
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">إنشاء عيادة جديدة</h1>
      <p className="text-slate-500 text-sm mb-6">سيتم إنشاء حساب العيادة واعتمادها مباشرة. يستخدم المسؤول بيانات الدخول لتسجيل الدخول لاحقاً.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">اسم المسؤول / الطبيب</label>
          <input className={inputCls} value={form.name} onChange={set('name')} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني (لتسجيل الدخول)</label>
            <input className={inputCls} type="email" dir="ltr" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <input className={inputCls} type="password" dir="ltr" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
        </div>
        <hr className="border-slate-100" />
        <div>
          <label className="block text-sm font-medium mb-2">نوع المنشأة</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'private', l: 'عيادة خاصة', icon: Building2 },
              { k: 'hospital', l: 'مستشفى', icon: Hospital },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setForm({ ...form, facilityType: t.k })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold ${
                  form.facilityType === t.k ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{facilityNamePlaceholder[form.facilityType]}</label>
          <input className={inputCls} value={form.clinicName} onChange={set('clinicName')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">العنوان</label>
          <input className={inputCls} value={form.address} onChange={set('address')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">هاتف العيادة</label>
          <input className={inputCls} type="tel" dir="ltr" value={form.clinicPhone} onChange={set('clinicPhone')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">التخصصات الطبية</label>
          <div className="flex flex-wrap gap-2">
            {MEDICAL_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const selected = form.specialties.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      specialties: selected
                        ? form.specialties.filter((s) => s !== cat.id)
                        : [...form.specialties, cat.id],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">وصف العيادة</label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={set('description')} />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60 flex justify-center">
          {loading ? <LoadingSpinner size="sm" /> : 'إنشاء العيادة'}
        </button>
      </form>
    </div>
  );
}
