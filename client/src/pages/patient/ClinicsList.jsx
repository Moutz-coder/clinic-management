import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clinicAPI } from '../../api/services';
import { Search, MapPin, Phone, Stethoscope } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Navbar from '../../components/Navbar';
import { patientLinks } from '../../config/navLinks';
import { MEDICAL_CATEGORIES, getCategoryLabel } from '../../config/specialtyCategories';
import { facilityLabels } from '../../utils/facilityLabels';

export default function ClinicsList() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;
      const { data } = await clinicAPI.getAll(params);
      setClinics(data.data);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClinics();
  };

  const selectCategory = (id) => {
    setCategory(id);
  };

  const activeCategory = MEDICAL_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar links={patientLinks} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">العيادات الطبية</h1>
        <p className="text-slate-500 mb-6">ابحث عن العيادة المناسبة أو اختر التخصص الطبي</p>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم العيادة..."
              className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none bg-white"
            />
          </div>
          <button type="submit" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shrink-0">
            بحث
          </button>
        </form>

        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-700 mb-3">التخصصات الطبية</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {MEDICAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-all shrink-0 ${
                  category === cat.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {category !== 'all' && (
          <p className="text-sm text-slate-500 mb-4">
            عرض عيادات تخصص <span className="font-semibold text-primary-700">{activeCategory?.label}</span>
            {' '}({clinics.length} عيادة)
          </p>
        )}

        {loading ? (
          <LoadingSpinner className="py-20" size="lg" />
        ) : clinics.length === 0 ? (
          <EmptyState
            title="لا توجد عيادات"
            description={category !== 'all' ? `لا توجد عيادات في تخصص ${activeCategory?.label}` : 'جرب تغيير معايير البحث'}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map((clinic) => (
              <Link
                key={clinic._id}
                to={`/clinics/${clinic._id}`}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all group"
              >
                {clinic.image ? (
                  <img src={clinic.image} alt={clinic.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-l from-primary-100 to-primary-200 flex items-center justify-center">
                    <Stethoscope className="w-10 h-10 text-primary-600" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-800 truncate">{clinic.name}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {facilityLabels[clinic.facilityType] || 'عيادة خاصة'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {clinic.specialties?.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{getCategoryLabel(s)}</span>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{clinic.address}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /><span dir="ltr">{clinic.phone}</span></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
