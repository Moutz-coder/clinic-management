import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  BriefcaseMedical,
  GraduationCap,
  Star,
  Eye,
  Info,
  User,
  Flag,
  Building2,
  MessageCircle,
  SquarePen,
  Stethoscope,
} from 'lucide-react';
import { clinicAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';
import Modal from './Modal';
import { getCategoryLabel } from '../config/specialtyCategories';
import { genderLabels } from '../utils/helpers';

const FAVORITES_KEY = 'favoriteDoctors';

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function DoctorCard({ clinicId, doctorId, doctor, onUpdate }) {
  const { user } = useAuth();
  const [views, setViews] = useState(doctor?.views ?? 0);
  const [rating, setRating] = useState(doctor?.rating ?? 0);
  const [favorite, setFavorite] = useState(() => getFavorites().includes(clinicId));
  const [profileOpen, setProfileOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    clinicAPI.trackView(clinicId, doctorId)
      .then(({ data }) => setViews(data.data.views))
      .catch(() => {});
  }, [clinicId, doctorId]);

  useEffect(() => {
    setViews(doctor?.views ?? 0);
    setRating(doctor?.rating ?? 0);
  }, [doctor]);

  if (!doctor) return null;

  const toggleFavorite = () => {
    const favorites = getFavorites();
    const next = favorite
      ? favorites.filter((id) => id !== clinicId)
      : [...favorites, clinicId];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setFavorite(!favorite);
  };

  const submitRating = async () => {
    if (!selectedRating) {
      toast.error('اختر تقييماً');
      return;
    }
    if (!user) {
      toast.error('يجب تسجيل الدخول لتقييم الطبيب');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await clinicAPI.rateDoctor(clinicId, selectedRating, doctorId);
      setRating(data.data.rating);
      onUpdate?.({ ...doctor, rating: data.data.rating, ratingCount: data.data.ratingCount });
      toast.success('تم إرسال تقييمك');
      setRateOpen(false);
      setSelectedRating(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إرسال التقييم');
    } finally {
      setSubmitting(false);
    }
  };

  const specialtyLabel = getCategoryLabel(doctor.specialty) || doctor.specialty || '—';
  const infoTags = [
    doctor.gender && { icon: User, label: genderLabels[doctor.gender] || doctor.gender },
    doctor.rank && { icon: GraduationCap, label: doctor.rank },
    doctor.country && { icon: Flag, label: doctor.country },
    doctor.city && { icon: Building2, label: doctor.city },
  ].filter(Boolean);

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100">
                {doctor.photo ? (
                  <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                    <Stethoscope className="w-10 h-10 text-blue-500" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={toggleFavorite}
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="إضافة للمفضلة"
              >
                <Heart className={`w-4 h-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
              </button>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{doctor.name}</h2>

              {specialtyLabel !== '—' && (
                <p className="flex items-center gap-1.5 text-blue-600 font-medium mt-1.5 text-sm sm:text-base">
                  <BriefcaseMedical className="w-4 h-4 shrink-0" />
                  <span className="truncate">{specialtyLabel}</span>
                </p>
              )}

              {doctor.degree && (
                <p className="flex items-center gap-1.5 text-slate-500 mt-1 text-sm">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {doctor.degree}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-100">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {Number(rating).toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                  <Eye className="w-4 h-4" />
                  {views} مشاهدة
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold mb-3">
              <Info className="w-4 h-4 text-blue-500" />
              معلومات الطبيب
            </div>

            {infoTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {infoTags.map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm"
                  >
                    <tag.icon className="w-3.5 h-3.5 text-slate-400" />
                    {tag.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">لا توجد معلومات إضافية بعد</p>
            )}

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
                  doctor.availableForConsultation
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {doctor.availableForConsultation ? 'متاح للاستشارة' : 'غير متاح للاستشارة'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm sm:text-base transition-colors shadow-sm"
            >
              <Eye className="w-4 h-4" />
              عرض الملف
            </button>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toast.error('يجب تسجيل الدخول لتقييم الطبيب');
                  return;
                }
                setRateOpen(true);
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm sm:text-base transition-colors shadow-sm"
            >
              <SquarePen className="w-4 h-4" />
              قيم الطبيب
            </button>
          </div>
        </div>
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="ملف الطبيب" size="md">
        <div className="flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 mb-4">
            {doctor.photo ? (
              <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50">
                <Stethoscope className="w-12 h-12 text-blue-400" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800">{doctor.name}</h3>
          <p className="text-blue-600 font-medium mt-1">{specialtyLabel}</p>
          {doctor.degree && <p className="text-slate-500 text-sm mt-1">{doctor.degree}</p>}
          <div className="flex gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
              ⭐ {Number(rating).toFixed(1)}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
              {views} مشاهدة
            </span>
          </div>
          {doctor.bio ? (
            <p className="text-slate-600 leading-relaxed mt-5 text-right w-full">{doctor.bio}</p>
          ) : (
            <p className="text-slate-400 mt-5">لا يوجد وصف للطبيب</p>
          )}
          {doctor.availableForConsultation && (
            <Link
              to={`/clinics/${clinicId}/contact`}
              onClick={() => setProfileOpen(false)}
              className="mt-5 w-full py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
            >
              تواصل مع الطبيب
            </Link>
          )}
        </div>
      </Modal>

      <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="قيم الطبيب" size="sm">
        <p className="text-slate-600 text-center mb-4">كيف كانت تجربتك مع {doctor.name}؟</p>
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedRating(value)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-9 h-9 ${
                  value <= selectedRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={submitRating}
          disabled={submitting || !selectedRating}
          className="w-full py-3 rounded-xl bg-amber-400 text-white font-bold hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </button>
      </Modal>
    </>
  );
}
