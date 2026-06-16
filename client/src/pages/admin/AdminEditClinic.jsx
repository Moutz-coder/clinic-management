import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import { ArrowRight, Building2, Hospital } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MEDICAL_CATEGORIES } from '../../config/specialtyCategories';
import { facilityNamePlaceholder } from '../../utils/facilityLabels';

export default function AdminEditClinic() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    adminName: '', adminEmail: '', adminPhone: '', facilityType: 'private', clinicName: '', description: '', address: '', clinicPhone: '', specialties: [],
  });

  useEffect(() => {
    adminAPI.getClinic(id)
      .then(({ data }) => {
        const clinic = data.data;
        setForm({
          adminName: clinic.userId?.name || '',
          adminEmail: clinic.userId?.email || '',
          adminPhone: clinic.userId?.phone || '',
          facilityType: clinic.facilityType || 'private',
          clinicName: clinic.name || '',
          description: clinic.description || '',
          address: clinic.address || '',
          clinicPhone: clinic.phone || '',
          specialties: clinic.specialties || [],
        });
      })
      .catch(() => toast.error('فشل تحميل بيانات العيادة'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateClinic(id, {
        name: form.adminName,
        email: form.adminEmail,
        phone: form.adminPhone,
        facilityType: form.facilityType,
        clinicName: form.clinicName,
        description: form.description,
        address: form.address,
        clinicPhone: form.clinicPhone,
        specialties: form.specialties,
      });
      toast.success('تم تحديث بيانات العيادة');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/clinics" className="text-primary-600 text-sm font-medium hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowRight className="w-4 h-4" /> العودة لقائمة العيادات
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">تعديل العيادة</h1>
      <p className="text-slate-500 text-sm mb-6">عدّل بيانات العيادة والمسؤول عنها.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">اسم المسؤول / الطبيب</label>
          <input className={inputCls} value={form.adminName} onChange={set('adminName')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">البريد الإلكتروني (لتسجيل الدخول)</label>
          <input className={inputCls} type="email" dir="ltr" value={form.adminEmail} onChange={set('adminEmail')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">رقم الهاتف (اختياري)</label>
          <input className={inputCls} type="tel" dir="ltr" value={form.adminPhone} onChange={set('adminPhone')} />
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
        <button type="submit" disabled={saving} className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60 flex justify-center">
          {saving ? <LoadingSpinner size="sm" /> : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}
