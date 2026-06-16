import { Navigate } from 'react-router-dom';

export default function DoctorLogin() {
  return <Navigate to="/login?tab=doctor" replace />;
}
