import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

let toastId = 0;
let addToastFn = null;

export const toast = {
  success: (msg) => addToastFn?.({ type: 'success', message: msg }),
  error: (msg) => addToastFn?.({ type: 'error', message: msg }),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  addToastFn = ({ type, message }) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  return (
    <>
      {children}
      <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-[slideIn_0.3s_ease] ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {t.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
