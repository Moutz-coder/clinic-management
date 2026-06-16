import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clinicAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dayLabels } from '../../utils/helpers';
import { MEDICAL_CATEGORIES } from '../../config/specialtyCategories';
import { Building2, Upload, Clock, UserCircle, Hospital, Plus, Trash2, Users, KeyRound } from 'lucide-react';
import { facilityNamePlaceholder } from '../../utils/facilityLabels';

const defaultDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function ClinicSettings() {
  const { profile, refreshUser } = useAuth();
  const fileRef = useRef(null);
  const doctorPhotoRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDoctor, setUploadingDoctor] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [workingHours, setWorkingHours] = useState([]);
  const [generalWorkingHours, setGeneralWorkingHours] = useState({});
  const [form, setForm] = useState({
    name: profile?.name || '',
    facilityType: profile?.facilityType || 'private',
    description: profile?.description || '',
    address: profile?.address || '',
    phone: profile?.phone || '',
    newSpecialty: '',
  });
  const [doctorForm, setDoctorForm] = useState({
    specialty: profile?.doctorProfile?.specialty || profile?.specialties?.[0] || '',
    degree: profile?.doctorProfile?.degree || '',
    gender: profile?.doctorProfile?.gender || '',
    rank: profile?.doctorProfile?.rank || '',
    country: profile?.doctorProfile?.country || 'LY',
    city: profile?.doctorProfile?.city || '',
    availableForConsultation: profile?.doctorProfile?.availableForConsultation ?? false,
    bio: profile?.doctorProfile?.bio || '',
  });
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [centerDoctors, setCenterDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', degree: '', rank: '', availableForConsultation: false, accessPin: '' });
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [editingPinId, setEditingPinId] = useState(null);
  const [pinDraft, setPinDraft] = useState('');
  const [savingPinId, setSavingPinId] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary-500';

  useEffect(() => {
    if (profile?.workingHours?.length) {
      setWorkingHours(profile.workingHours);
    } else {
      setWorkingHours(defaultDays.map((day) => ({
        day, open: '09:00', close: '17:00', isOpen: day !== 'saturday',
      })));
    }

    if (profile?.generalWorkingHours) {
      setGeneralWorkingHours(profile.generalWorkingHours);
    } else {
      setGeneralWorkingHours({
        sunday: { isOpen: true, open: '09:00', close: '17:00' },
        monday: { isOpen: true, open: '09:00', close: '17:00' },
        tuesday: { isOpen: true, open: '09:00', close: '17:00' },
        wednesday: { isOpen: true, open: '09:00', close: '17:00' },
        thursday: { isOpen: true, open: '09:00', close: '17:00' },
        friday: { isOpen: false, open: '09:00', close: '17:00' },
        saturday: { isOpen: false, open: '09:00', close: '17:00' },
      });
    }
  }, [profile?.workingHours, profile?.generalWorkingHours]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      facilityType: profile.facilityType || 'private',
      description: profile.description || '',
      address: profile.address || '',
      phone: profile.phone || '',
      newSpecialty: '',
    });
    setDoctorForm({
      specialty: profile.doctorProfile?.specialty || profile.specialties?.[0] || '',
      degree: profile.doctorProfile?.degree || '',
      gender: profile.doctorProfile?.gender || '',
      rank: profile.doctorProfile?.rank || '',
      country: profile.doctorProfile?.country || 'LY',
      city: profile.doctorProfile?.city || '',
      availableForConsultation: profile.doctorProfile?.availableForConsultation ?? false,
      bio: profile.doctorProfile?.bio || '',
    });
    setCenterDoctors((profile.doctors || []).filter((d) => d.isActive !== false));
  }, [profile]);

  const updateDay = (day, field, value) => {
    setWorkingHours((prev) => prev.map((wh) => (wh.day === day ? { ...wh, [field]: value } : wh)));
  };

  const updateGeneralDay = (day, field, value) => {
    setGeneralWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const saveGeneralWorkingHours = async () => {
    setSavingHours(true);
    try {
      await clinicAPI.updateGeneralWorkingHours(generalWorkingHours);
      await refreshUser();
      toast.success('تم حفظ دوام العيادة العام');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSavingHours(false);
    }
  };

  const saveWorkingHours = async () => {
    setSavingHours(true);
    try {
      await clinicAPI.updateWorkingHours(workingHours);
      await refreshUser();
      toast.success('تم حفظ ساعات العمل');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSavingHours(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      await clinicAPI.update({
        name: form.name,
        facilityType: form.facilityType,
        description: form.description,
        address: form.address,
        phone: form.phone,
      });
      await refreshUser();
      toast.success('تم حفظ التغييرات');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const addSpecialty = async () => {
    if (!form.newSpecialty.trim()) return;
    try {
      await clinicAPI.addSpecialty(form.newSpecialty.trim());
      await refreshUser();
      setForm({ ...form, newSpecialty: '' });
      toast.success('تم إضافة التخصص');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإضافة');
    }
  };

  const removeSpecialty = async (s) => {
    try {
      await clinicAPI.removeSpecialty(s);
      await refreshUser();
      toast.success('تم حذف التخصص');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await clinicAPI.uploadImage(file);
      await refreshUser();
      toast.success('تم رفع صورة العيادة');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDoctorPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoctor(true);
    try {
      await clinicAPI.uploadDoctorPhoto(file);
      await refreshUser();
      toast.success('تم رفع صورة الطبيب');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل رفع الصورة');
    } finally {
      setUploadingDoctor(false);
      if (doctorPhotoRef.current) doctorPhotoRef.current.value = '';
    }
  };

  const saveDoctorProfile = async () => {
    setSavingDoctor(true);
    try {
      await clinicAPI.update({ doctorProfile: doctorForm });
      await refreshUser();
      toast.success('تم حفظ ملف الطبيب');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim()) {
      toast.error('اسم الطبيب مطلوب');
      return;
    }
    if (!/^\d{6}$/.test(newDoctor.accessPin)) {
      toast.error('حدّد رمز دخول من 6 أرقام للطبيب');
      return;
    }
    setAddingDoctor(true);
    try {
      const { data } = await clinicAPI.addDoctor(newDoctor);
      setCenterDoctors((prev) => [...prev, data.data]);
      setNewDoctor({ name: '', specialty: '', degree: '', rank: '', availableForConsultation: false, accessPin: '' });
      await refreshUser();
      toast.success('تم إضافة الطبيب');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإضافة');
    } finally {
      setAddingDoctor(false);
    }
  };

  const startEditPin = (doctorId) => {
    setEditingPinId(doctorId);
    setPinDraft('');
  };

  const cancelEditPin = () => {
    setEditingPinId(null);
    setPinDraft('');
  };

  const handleSaveDoctorPin = async (doctorId) => {
    if (!/^\d{6}$/.test(pinDraft)) {
      toast.error('رمز الدخول يجب أن يكون 6 أرقام');
      return;
    }
    setSavingPinId(doctorId);
    try {
      await clinicAPI.resetDoctorPin(doctorId, pinDraft);
      setCenterDoctors((prev) => prev.map((d) => (d._id === doctorId ? { ...d, hasAccessPin: true } : d)));
      cancelEditPin();
      toast.success('تم حفظ رمز الدخول');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ الرمز');
    } finally {
      setSavingPinId(null);
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    if (!window.confirm('هل تريد إزالة هذا الطبيب؟')) return;
    try {
      await clinicAPI.removeDoctor(doctorId);
      setCenterDoctors((prev) => prev.filter((d) => d._id !== doctorId));
      await refreshUser();
      toast.success('تم إزالة الطبيب');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإزالة');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">إعدادات العيادة</h1>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h3 className="font-bold mb-4">صورة العيادة</h3>
        <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-l from-primary-600 to-primary-800 mb-4">
          {profile?.image ? (
            <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-16 h-16 text-white/30" />
            </div>
          )}
        </div>
        <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
        >
          {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'جاري الرفع...' : 'رفع صورة'}
        </button>
        <p className="text-xs text-slate-400 mt-2">تظهر الصورة في الصفحة الرئيسية للعيادة للمرضى</p>
      </div>

      {form.facilityType !== 'hospital' && (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-blue-500" /> ملف الطبيب
        </h3>
        <p className="text-xs text-slate-400 mb-4">يظهر هذا الملف للمرضى في الصفحة الرئيسية للعيادة</p>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 border-2 border-blue-100 shrink-0">
            {profile?.doctorProfile?.photo ? (
              <img src={profile.doctorProfile.photo} alt="الطبيب" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-300">
                <UserCircle className="w-10 h-10" />
              </div>
            )}
          </div>
          <div>
            <input type="file" ref={doctorPhotoRef} accept="image/*" className="hidden" onChange={handleDoctorPhotoUpload} />
            <button
              type="button"
              onClick={() => doctorPhotoRef.current?.click()}
              disabled={uploadingDoctor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-60"
            >
              {uploadingDoctor ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
              {uploadingDoctor ? 'جاري الرفع...' : 'رفع صورة الطبيب'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">التخصص</label>
            <select
              className={inputCls}
              value={doctorForm.specialty}
              onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
            >
              <option value="">اختر التخصص...</option>
              {MEDICAL_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الدرجة العلمية</label>
              <input
                className={inputCls}
                placeholder="مثال: بكالوريوس"
                value={doctorForm.degree}
                onChange={(e) => setDoctorForm({ ...doctorForm, degree: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الرتبة</label>
              <input
                className={inputCls}
                placeholder="مثال: أخصائي"
                value={doctorForm.rank}
                onChange={(e) => setDoctorForm({ ...doctorForm, rank: e.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الجنس</label>
              <select
                className={inputCls}
                value={doctorForm.gender}
                onChange={(e) => setDoctorForm({ ...doctorForm, gender: e.target.value })}
              >
                <option value="">—</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الدولة</label>
              <input
                className={inputCls}
                value={doctorForm.country}
                onChange={(e) => setDoctorForm({ ...doctorForm, country: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <input
                className={inputCls}
                placeholder="مثال: صبراته"
                value={doctorForm.city}
                onChange={(e) => setDoctorForm({ ...doctorForm, city: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نبذة عن الطبيب</label>
            <textarea
              className={inputCls}
              rows={3}
              value={doctorForm.bio}
              onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={doctorForm.availableForConsultation}
              onChange={(e) => setDoctorForm({ ...doctorForm, availableForConsultation: e.target.checked })}
              className="rounded accent-blue-500"
            />
            متاح للاستشارة
          </label>
          <button
            onClick={saveDoctorProfile}
            disabled={savingDoctor}
            className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-60"
          >
            {savingDoctor ? <LoadingSpinner size="sm" /> : 'حفظ ملف الطبيب'}
          </button>
        </div>
      </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" /> {form.facilityType === 'hospital' ? 'أطباء المركز' : 'أطباء إضافيون'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {form.facilityType === 'hospital'
            ? 'بصفتك مسؤول المركز، أضف الأطباء وحدّد لكل طبيب رمز دخول من 6 أرقام'
            : 'يمكنك إضافة أطباء إضافيين مع رمز دخول من 6 أرقام لكل طبيب'}
        </p>

        {centerDoctors.length > 0 && (
          <div className="space-y-2 mb-4">
            {centerDoctors.map((doc) => (
              <div key={doc._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-500">
                      {MEDICAL_CATEGORIES.find((c) => c.id === doc.specialty)?.label || doc.specialty || 'طبيب'}
                      {doc.availableForConsultation && ' • متاح للاستشارة'}
                      {doc.hasAccessPin ? ' • رمز مفعّل' : ' • بدون رمز'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditPin(doc._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 rounded-lg flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {doc.hasAccessPin ? 'تعديل الرمز' : 'تعيين الرمز'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctor(doc._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {editingPinId === doc._id && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinDraft}
                      onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 text-center tracking-[0.3em] outline-none focus:border-primary-500"
                      placeholder="6 أرقام"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveDoctorPin(doc._id)}
                      disabled={savingPinId === doc._id}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingPinId === doc._id ? <LoadingSpinner size="sm" /> : 'حفظ'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditPin}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
          <span>حدّد رمزاً ثابتاً من 6 أرقام لكل طبيب. يبقى كما هو حتى تعدّله أنت من هنا.</span>
        </div>

        <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">إضافة طبيب جديد</p>
          <input
            className={inputCls}
            placeholder="اسم الطبيب *"
            value={newDoctor.name}
            onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
          />
          <select
            className={inputCls}
            value={newDoctor.specialty}
            onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
          >
            <option value="">التخصص...</option>
            {MEDICAL_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="الدرجة العلمية"
              value={newDoctor.degree}
              onChange={(e) => setNewDoctor({ ...newDoctor, degree: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="الرتبة"
              value={newDoctor.rank}
              onChange={(e) => setNewDoctor({ ...newDoctor, rank: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رمز الدخول (6 أرقام) *</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              className={`${inputCls} text-center tracking-[0.3em]`}
              placeholder="••••••"
              value={newDoctor.accessPin}
              onChange={(e) => setNewDoctor({ ...newDoctor, accessPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              dir="ltr"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newDoctor.availableForConsultation}
              onChange={(e) => setNewDoctor({ ...newDoctor, availableForConsultation: e.target.checked })}
              className="rounded accent-primary-600"
            />
            متاح للاستشارة
          </label>
          <button
            type="button"
            onClick={handleAddDoctor}
            disabled={addingDoctor}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60"
          >
            {addingDoctor ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
            {addingDoctor ? 'جاري الإضافة...' : 'إضافة طبيب'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 mb-6">
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
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
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
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">العنوان</label>
          <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الهاتف</label>
          <input className={inputCls} dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الوصف</label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button onClick={save} disabled={loading} className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60">
          {loading ? <LoadingSpinner size="sm" /> : 'حفظ'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-bold mb-4">التخصصات</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile?.specialties?.map((s) => (
            <span key={s} className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
              {s}
              <button onClick={() => removeSpecialty(s)} className="text-red-500 hover:text-red-700">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            className={inputCls}
            value={form.newSpecialty}
            onChange={(e) => setForm({ ...form, newSpecialty: e.target.value })}
          >
            <option value="">اختر تخصصاً...</option>
            {MEDICAL_CATEGORIES.filter((c) => c.id !== 'all' && !profile?.specialties?.includes(c.id)).map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <button onClick={addSpecialty} disabled={!form.newSpecialty} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium shrink-0 disabled:opacity-50">إضافة</button>
        </div>
      </div>

      {workingHours.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" /> ساعات العمل
          </h3>
          <div className="space-y-3">
            {workingHours.map((wh) => (
              <div key={wh.day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="font-medium text-slate-800 sm:w-24">{dayLabels[wh.day]}</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={wh.isOpen}
                    onChange={(e) => updateDay(wh.day, 'isOpen', e.target.checked)}
                    className="rounded accent-primary-600"
                  />
                  مفتوح
                </label>
                {wh.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={wh.open}
                      onChange={(e) => updateDay(wh.day, 'open', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      value={wh.close}
                      onChange={(e) => updateDay(wh.day, 'close', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-red-500 text-sm font-medium">مغلق</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={saveWorkingHours}
            disabled={savingHours}
            className="mt-4 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60"
          >
            {savingHours ? <LoadingSpinner size="sm" /> : 'حفظ ساعات العمل'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" /> دوام العيادة العام
        </h3>
        <p className="text-xs text-slate-400 mb-4">يحدد صاحب العيادة دوام العيادة العام، بينما يحدد كل طبيب أوقاته الخاصة</p>
        <div className="space-y-3">
          {defaultDays.map((day) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="font-medium text-slate-800 sm:w-24">{dayLabels[day]}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={generalWorkingHours[day]?.isOpen || false}
                  onChange={(e) => updateGeneralDay(day, 'isOpen', e.target.checked)}
                  className="rounded accent-blue-600"
                />
                مفتوح
              </label>
              {generalWorkingHours[day]?.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={generalWorkingHours[day]?.open || '09:00'}
                    onChange={(e) => updateGeneralDay(day, 'open', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="time"
                    value={generalWorkingHours[day]?.close || '17:00'}
                    onChange={(e) => updateGeneralDay(day, 'close', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              ) : (
                <span className="text-red-500 text-sm font-medium">مغلق</span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={saveGeneralWorkingHours}
          disabled={savingHours}
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60"
        >
          {savingHours ? <LoadingSpinner size="sm" /> : 'حفظ دوام العيادة العام'}
        </button>
      </div>
    </div>
  );
}
