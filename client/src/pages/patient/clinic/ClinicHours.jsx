import { useClinicPage } from '../../../context/ClinicPageContext';
import { dayLabels } from '../../../utils/helpers';
import { Clock } from 'lucide-react';

export default function ClinicHours() {
  const { clinic } = useClinicPage();

  if (!clinic.workingHours?.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
        لم تُحدَّد ساعات العمل بعد.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-primary-600" /> ساعات العمل
      </h2>
      <div className="space-y-1">
        {clinic.workingHours.map((wh) => (
          <div key={wh.day} className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-slate-50 border-b border-slate-50 last:border-0">
            <span className="font-semibold text-slate-800">{dayLabels[wh.day]}</span>
            <span className={`text-sm font-medium ${wh.isOpen ? 'text-slate-600' : 'text-red-500'}`}>
              {wh.isOpen ? `${wh.open} - ${wh.close}` : 'مغلق'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
