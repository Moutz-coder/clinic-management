import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clinicAPI, conversationAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Stethoscope, MessageCircle, Star } from 'lucide-react';
import { getCategoryLabel } from '../../config/specialtyCategories';
import { facilityLabels } from '../../utils/facilityLabels';

function flattenConsultationDoctors(clinics) {
  const list = [];
  clinics.forEach((clinic) => {
    const doctors = clinic.doctors?.length
      ? clinic.doctors.filter((d) => d.availableForConsultation && d.isActive !== false)
      : clinic.doctorProfile?.availableForConsultation
        ? [{ _id: 'primary', name: clinic.userId?.name || clinic.name, ...clinic.doctorProfile }]
        : [];

    doctors.forEach((doc) => {
      list.push({ clinic, doctor: doc });
    });
  });
  return list;
}

export default function PatientConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    clinicAPI.getAll({ consultation: 'true', limit: 50 })
      .then(({ data }) => setEntries(flattenConsultationDoctors(data.data || [])))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const startConsultation = async (clinicId) => {
    if (!user) return navigate('/login');
    setStarting(clinicId);
    try {
      const { data } = await conversationAPI.startPatient(clinicId);
      navigate(`/patient/chat/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل بدء الاستشارة');
    } finally {
      setStarting(null);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">استشارات طبية</h1>
        <p className="text-slate-500 text-sm mt-1">تواصل مع الأطباء المتاحين للاستشارة عبر المحادثات</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={Stethoscope} title="لا يوجد أطباء متاحين للاستشارة حالياً" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {entries.map(({ clinic, doctor }) => {
            const specialty = doctor.specialty || clinic.specialties?.[0];
            const key = `${clinic._id}-${doctor._id}`;
            return (
              <div key={key} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    {doctor.photo || clinic.image ? (
                      <img src={doctor.photo || clinic.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope className="w-7 h-7 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800">{doctor.name}</h3>
                    <p className="text-sm text-primary-700">{getCategoryLabel(specialty)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{facilityLabels[clinic.facilityType] || 'عيادة'} — {clinic.name}</p>
                    {doctor.rating > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {doctor.rating} ({doctor.ratingCount})
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => startConsultation(clinic._id)}
                    disabled={starting === clinic._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {starting === clinic._id ? 'جاري الفتح...' : 'بدء استشارة'}
                  </button>
                  <Link
                    to={`/clinics/${clinic._id}`}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200"
                  >
                    الملف
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
