import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClinicSettings from './ClinicSettings';

export default function ClinicSettingsRoute() {
  const { isDoctorSession } = useAuth();
  if (isDoctorSession) return <Navigate to="/clinic/dashboard" replace />;
  return <ClinicSettings />;
}
