import { Link } from 'react-router-dom';

export default function StatCard({ icon: Icon, label, value, color = 'primary', trend, to }) {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const className = `bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all block text-right ${
    to ? 'hover:shadow-lg hover:border-primary-200 cursor-pointer hover:-translate-y-1' : 'hover:shadow-md'
  }`;

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value ?? 0}</p>
        {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        {to && <p className="text-xs text-primary-600 mt-2 font-medium">عرض التفاصيل ←</p>}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
