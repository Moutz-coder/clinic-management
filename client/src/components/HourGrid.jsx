import { useState, useEffect } from 'react';
import { HOUR_STATUS, isPatientSlotVisible } from '../utils/appointmentSchedule';

export default function HourGrid({ hours, mode = 'clinic', onHourClick, loadingHour, selectedDate, nowMs }) {
  const [now, setNow] = useState(() => nowMs ?? Date.now());

  useEffect(() => {
    if (nowMs != null) setNow(nowMs);
  }, [nowMs]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const currentTime = new Date(nowMs ?? now);
  const checkPatientSlot = (slot) => isPatientSlotVisible(slot, selectedDate, currentTime);

  const visibleHours =
    mode === 'patient'
      ? hours.filter(checkPatientSlot)
      : hours;

  if (mode === 'patient' && visibleHours.length === 0) {
    return <p className="text-slate-500 text-center py-8">لا توجد ساعات متاحة في هذا اليوم</p>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
      {visibleHours.map((slot) => {
        const styles = HOUR_STATUS[slot.status] || HOUR_STATUS.empty;
        const className = mode === 'clinic' ? styles.clinicClass : styles.patientClass;
        const canClick =
          mode === 'clinic'
            ? !slot.isPast && slot.status !== 'booked'
            : checkPatientSlot(slot);

        return (
          <button
            key={slot.hour}
            type="button"
            disabled={!canClick || loadingHour === slot.hour}
            onClick={() => canClick && onHourClick?.(slot)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-semibold transition-all ${className} disabled:opacity-60`}
          >
            <span className="text-base">{slot.label}</span>
            {mode === 'clinic' && (
              <span className="text-xs mt-1 font-medium opacity-80">
                {loadingHour === slot.hour ? '...' : styles.label}
              </span>
            )}
            {mode === 'patient' && loadingHour === slot.hour && (
              <span className="text-xs mt-1 font-medium opacity-80">...</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
