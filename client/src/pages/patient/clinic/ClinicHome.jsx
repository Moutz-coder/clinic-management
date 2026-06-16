import { Link } from 'react-router-dom';
import { useClinicPage } from '../../../context/ClinicPageContext';
import DoctorCard from '../../../components/DoctorCard';
import DoctorPicker from '../../../components/DoctorPicker';
import { getCategoryLabel } from '../../../config/specialtyCategories';
import { MapPin, Phone, Calendar, Clock, MessageCircle } from 'lucide-react';

export default function ClinicHome() {
  const { clinic, clinicId, doctors, selectedDoctor, setSelectedDoctor } = useClinicPage();

  const sections = [
    { to: `/clinics/${clinicId}/book`, icon: Calendar, label: 'حجز موعد', desc: 'احجز موعدك الآن', color: 'bg-primary-50 text-primary-700 border-primary-100' },
    { to: `/clinics/${clinicId}/hours`, icon: Clock, label: 'ساعات العمل', desc: 'اطّلع على أوقات الدوام', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { to: `/clinics/${clinicId}/contact`, icon: MessageCircle, label: 'تواصل معنا', desc: 'راسل العيادة مباشرة', color: 'bg-green-50 text-green-700 border-green-100' },
  ];

  return (
    <div className="space-y-6">
      {doctors.length === 0 && clinic.facilityType === 'hospital' ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center text-amber-800 text-sm">
          لا يوجد أطباء مضافون بعد في هذا المركز.
        </div>
      ) : (
        <>
          <DoctorPicker
            doctors={doctors}
            selectedId={selectedDoctor?._id}
            onSelect={setSelectedDoctor}
            title={doctors.length > 1 ? 'اختر الطبيب المعالج' : undefined}
          />

          {selectedDoctor && (
            <DoctorCard
              clinicId={clinicId}
              doctorId={selectedDoctor._id}
              doctor={selectedDoctor}
              onUpdate={(updated) => setSelectedDoctor({ ...selectedDoctor, ...updated })}
            />
          )}
        </>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">عن {clinic.facilityType === 'hospital' ? 'المركز' : 'العيادة'}</h2>
        {clinic.description ? (
          <p className="text-slate-600 leading-relaxed">{clinic.description}</p>
        ) : (
          <p className="text-slate-400">لا يوجد وصف متاح حالياً.</p>
        )}

        {clinic.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {clinic.specialties.map((s) => (
              <span key={s} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {getCategoryLabel(s)}
              </span>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-500">العنوان</p>
              <p className="text-slate-800">{clinic.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-500">الهاتف</p>
              <p className="text-slate-800" dir="ltr">{clinic.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${s.color}`}
          >
            <s.icon className="w-8 h-8 mb-3" />
            <h3 className="font-bold">{s.label}</h3>
            <p className="text-sm opacity-80 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
