import { Stethoscope, Star } from 'lucide-react';
import { getCategoryLabel } from '../config/specialtyCategories';

export default function DoctorPicker({ doctors, selectedId, onSelect, title = 'اختر الطبيب' }) {
  if (!doctors || doctors.length <= 1) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {doctors.map((doc) => {
          const active = String(selectedId) === String(doc._id);
          return (
            <button
              key={doc._id}
              type="button"
              onClick={() => onSelect(doc)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                active
                  ? 'border-primary-600 bg-primary-50 shadow-sm'
                  : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-100 shrink-0">
                {doc.photo ? (
                  <img src={doc.photo} alt={doc.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                <p className="text-sm text-primary-700 truncate">{getCategoryLabel(doc.specialty) || doc.specialty || 'طبيب'}</p>
                {doc.rating > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400" /> {Number(doc.rating).toFixed(1)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
