import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useParams, Link } from 'react-router-dom';
import { clinicAPI } from '../api/services';
import { ClinicPageContext } from '../context/ClinicPageContext';
import Navbar from './Navbar';
import LoadingSpinner from './LoadingSpinner';
import { patientLinks } from '../config/navLinks';
import { getClinicNavLinks } from '../config/clinicNavLinks';
import { facilityLabels } from '../utils/facilityLabels';
import { getCategoryLabel, MEDICAL_CATEGORIES } from '../config/specialtyCategories';
import { Building2, ArrowRight } from 'lucide-react';
import { toast } from './Toast';

export default function ClinicLayout() {
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const links = getClinicNavLinks(id);

  const doctors = useMemo(() => {
    if (!clinic) return [];
    if (clinic.doctors?.length) return clinic.doctors;
    if (clinic.doctor) return [clinic.doctor];
    return [];
  }, [clinic]);

  useEffect(() => {
    setLoading(true);
    clinicAPI.getById(id)
      .then(({ data }) => {
        const c = data.data;
        setClinic(c);
        const list = c.doctors?.length ? c.doctors : c.doctor ? [c.doctor] : [];
        setSelectedDoctor(list[0] || null);
      })
      .catch(() => {
        setClinic(null);
        setSelectedDoctor(null);
        toast.error('فشل تحميل بيانات العيادة');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        العيادة غير موجودة
      </div>
    );
  }

  const specialtyIcon = MEDICAL_CATEGORIES.find((c) => clinic.specialties?.includes(c.id))?.icon || '🏥';

  return (
    <ClinicPageContext.Provider value={{ clinic, clinicId: id, doctors, selectedDoctor, setSelectedDoctor }}>
      <div className="min-h-screen bg-slate-50">
        <Navbar links={patientLinks} />

        <div className="relative">
          {clinic.image ? (
            <img src={clinic.image} alt={clinic.name} className="w-full h-52 sm:h-64 object-cover" />
          ) : (
            <div className="w-full h-52 sm:h-64 bg-gradient-to-l from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-10 text-8xl">{specialtyIcon}</div>
                <div className="absolute bottom-10 left-10 text-6xl opacity-50">{specialtyIcon}</div>
              </div>
              <Building2 className="w-20 h-20 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-4 sm:p-6">
            <div className="max-w-5xl mx-auto">
              <Link to="/clinics" className="text-white/80 text-sm hover:text-white inline-flex items-center gap-1 mb-2">
                <ArrowRight className="w-4 h-4" /> العودة للعيادات
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{clinic.name}</h1>
              <p className="text-white/80 text-sm mt-1">
                {facilityLabels[clinic.facilityType] || 'عيادة خاصة'}
                {clinic.specialties?.length > 0 && ` • ${clinic.specialties.map(getCategoryLabel).join(' • ')}`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </div>
    </ClinicPageContext.Provider>
  );
}
