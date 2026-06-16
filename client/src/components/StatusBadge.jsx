export default function StatusBadge({ status }) {
  const map = {
    available: { label: 'متاح', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
    pending_confirmation: { label: 'بانتظار التأكيد', cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
    booked: { label: 'محجوز', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    completed: { label: 'مكتمل', cls: 'bg-green-100 text-green-700 border border-green-200' },
    cancelled: { label: 'ملغي', cls: 'bg-red-100 text-red-700 border border-red-200' },
    no_show: { label: 'لم يحضر', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
  return <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}
