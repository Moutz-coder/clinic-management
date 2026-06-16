import { Ban, CheckCircle } from 'lucide-react';

export default function ToggleActionButton({ isActive, onClick, entityLabel = '' }) {
  const active = isActive;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
        active
          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
      }`}
    >
      {active ? (
        <>
          <Ban className="w-4 h-4" />
          تعطيل{entityLabel ? ` ${entityLabel}` : ''}
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          تفعيل{entityLabel ? ` ${entityLabel}` : ''}
        </>
      )}
    </button>
  );
}
