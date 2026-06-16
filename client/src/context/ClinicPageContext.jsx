import { createContext, useContext } from 'react';

export const ClinicPageContext = createContext(null);

export function useClinicPage() {
  const ctx = useContext(ClinicPageContext);
  if (!ctx) throw new Error('useClinicPage must be used within ClinicLayout');
  return ctx;
}
