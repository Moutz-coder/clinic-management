import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, roles, blockDoctorSession }) {
  const { user, profile, loading, isDoctorSession } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  if (user.role === 'clinic' && profile && !profile.isApproved) {
    return <Navigate to="/login" replace state={{ pendingClinic: true }} />;
  }
  if (blockDoctorSession && isDoctorSession) {
    return <Navigate to="/clinic/dashboard" replace />;
  }

  return children;
}
