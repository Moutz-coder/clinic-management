import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import DoctorLogin from './pages/DoctorLogin';
import RegisterPatient from './pages/RegisterPatient';
import RegisterClinic from './pages/RegisterClinic';
import AdminCreateClinic from './pages/admin/AdminCreateClinic';
import ClinicsList from './pages/patient/ClinicsList';
import ClinicLayout from './components/ClinicLayout';
import ClinicHome from './pages/patient/clinic/ClinicHome';
import ClinicBook from './pages/patient/clinic/ClinicBook';
import ClinicHours from './pages/patient/clinic/ClinicHours';
import ClinicContact from './pages/patient/clinic/ClinicContact';
import MyAppointments from './pages/patient/MyAppointments';
import PatientConsultations from './pages/patient/PatientConsultations';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import ChatPage from './pages/ChatPage';

import ClinicDashboard from './pages/clinic/ClinicDashboard';
import ClinicAppointments from './pages/clinic/ClinicAppointments';
import ClinicPatients from './pages/clinic/ClinicPatients';
import PatientDetail from './pages/clinic/PatientDetail';
import PatientMedicalRecord from './pages/clinic/PatientMedicalRecord';
import ClinicSettingsRoute from './pages/clinic/ClinicSettingsRoute';
import DoctorsStatistics from './pages/clinic/DoctorsStatistics';
import DoctorWorkingDays from './pages/clinic/DoctorWorkingDays';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClinics from './pages/admin/AdminClinics';
import AdminEditClinic from './pages/admin/AdminEditClinic';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMedicalRecords from './pages/admin/AdminMedicalRecords';

import { patientLinks, clinicLinks, adminLinks } from './config/navLinks';
import { useAuth } from './context/AuthContext';

function ClinicDashboardLayout() {
  const { isDoctorSession } = useAuth();
  const links = isDoctorSession
    ? clinicLinks.filter((link) => link.to !== '/clinic/settings')
    : clinicLinks;

  return (
    <ProtectedRoute roles={['clinic']}>
      <DashboardLayout links={links} />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/doctor" element={<DoctorLogin />} />
            <Route path="/register/patient" element={<RegisterPatient />} />
            <Route path="/register/clinic" element={<RegisterClinic />} />

            <Route path="/clinics" element={<ClinicsList />} />
            <Route path="/clinics/:id" element={<ClinicLayout />}>
              <Route index element={<ClinicHome />} />
              <Route path="book" element={<ClinicBook />} />
              <Route path="hours" element={<ClinicHours />} />
              <Route path="contact" element={<ClinicContact />} />
            </Route>

            <Route path="/patient" element={<ProtectedRoute roles={['patient']}><DashboardLayout links={patientLinks} /></ProtectedRoute>}>
              <Route index element={<Navigate to="appointments" replace />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="consultations" element={<PatientConsultations />} />
              <Route path="chat" element={<ChatPage basePath="/patient/chat" />} />
              <Route path="chat/:id" element={<ChatPage basePath="/patient/chat" />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/clinic" element={<ClinicDashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ClinicDashboard />} />
              <Route path="appointments" element={<ClinicAppointments />} />
              <Route path="patients" element={<ClinicPatients />} />
              <Route path="patients/:patientId" element={<PatientDetail />} />
              <Route path="patients/:patientId/medical-record" element={<PatientMedicalRecord />} />
              <Route path="doctors/statistics" element={<DoctorsStatistics />} />
              <Route path="doctors/:doctorId/working-days" element={<DoctorWorkingDays />} />
              <Route path="chat" element={<ChatPage basePath="/clinic/chat" />} />
              <Route path="chat/:id" element={<ChatPage basePath="/clinic/chat" />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<ClinicSettingsRoute />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout links={adminLinks} /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clinics" element={<AdminClinics />} />
              <Route path="clinics/create" element={<AdminCreateClinic />} />
              <Route path="clinics/:id/edit" element={<AdminEditClinic />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="medical-records" element={<AdminMedicalRecords />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
