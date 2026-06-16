import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getCenterDoctors: (email) => api.get('/auth/center-doctors', { params: { email } }),
  doctorLogin: (data) => api.post('/auth/doctor-login', data),
  registerPatient: (data) => api.post('/auth/register/patient', data),
  registerClinic: (data) => api.post('/auth/register/clinic', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const clinicAPI = {
  getAll: (params) => api.get('/clinics', { params }),
  getById: (id) => api.get(`/clinics/${id}`),
  trackView: (id, doctorId) => api.post(`/clinics/${id}/view`, { doctorId }),
  rateDoctor: (id, rating, doctorId) => api.post(`/clinics/${id}/rate`, { rating, doctorId }),
  update: (data) => api.put('/clinics', data),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/clinics/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadDoctorPhoto: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/clinics/doctor-photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addSpecialty: (specialty) => api.post('/clinics/specialties', { specialty }),
  removeSpecialty: (specialty) => api.delete(`/clinics/specialties/${encodeURIComponent(specialty)}`),
  updateWorkingHours: (workingHours) => api.put('/clinics/working-hours', { workingHours }),
  updateGeneralWorkingHours: (generalWorkingHours) => api.put('/clinics/general-working-hours', { generalWorkingHours }),
  updateDoctorWorkingDays: (doctorId, workingDays) => api.put(`/clinics/doctors/${doctorId}/working-days`, { workingDays }),
  getDoctorsStatistics: () => api.get('/clinics/doctors/statistics'),
  getPatients: (params) => api.get('/clinics/manage/patients', { params }),
  getPatient: (patientId) => api.get(`/clinics/manage/patients/${patientId}`),
  createPatient: (data) => api.post('/clinics/manage/patients', data),
  getDashboard: () => api.get('/clinics/manage/dashboard'),
  addDoctor: (data) => api.post('/clinics/doctors', data),
  updateDoctor: (doctorId, data) => api.put(`/clinics/doctors/${doctorId}`, data),
  resetDoctorPin: (doctorId, pin) => api.put(`/clinics/doctors/${doctorId}/pin`, { pin }),
  removeDoctor: (doctorId) => api.delete(`/clinics/doctors/${doctorId}`),
};

export const appointmentAPI = {
  getScheduleDays: (clinicId, params) => api.get(`/appointments/schedule/${clinicId}/days`, { params }),
  getDaySchedule: (clinicId, date, params) => api.get(`/appointments/schedule/${clinicId}`, { params: { date, ...params } }),
  getClinicDaySchedule: (date) => api.get('/appointments/clinic/schedule', { params: { date } }),
  toggleScheduleSlot: (date, hour) => api.post('/appointments/clinic/schedule/toggle', { date, hour }),
  toggleCloseDay: (date) => api.post('/appointments/clinic/schedule/close-day', { date }),
  getAvailable: (clinicId) => api.get(`/appointments/available/${clinicId}`),
  book: (data) => api.post('/appointments/book', data),
  getMy: (params) => api.get('/appointments/my', { params }),
  confirm: (id) => api.put(`/appointments/${id}/confirm`),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  createSlots: (slots) => api.post('/appointments/slots', { slots }),
  getClinicAvailable: () => api.get('/appointments/clinic/available'),
  getClinic: (params) => api.get('/appointments/clinic', { params }),
  bookFromClinic: (data) => api.post('/appointments/clinic/book', data),
  walkIn: (data) => api.post('/appointments/clinic/walk-in', data),
  update: (id, data) => api.put(`/appointments/clinic/${id}`, data),
  updateStatus: (id, status) => api.put(`/appointments/clinic/${id}/status`, { status }),
  confirmClinic: (id) => api.put(`/appointments/clinic/${id}/confirm`),
  sendConfirmation: (id) => api.post(`/appointments/clinic/${id}/send-confirmation`),
  delete: (id) => api.delete(`/appointments/clinic/${id}`),
};

export const medicalAPI = {
  getMy: () => api.get('/medical-records/my'),
  create: (data) => api.post('/medical-records', data),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  getById: (id) => api.get(`/medical-records/${id}`),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
};

export const conversationAPI = {
  getAll: () => api.get('/conversations'),
  getUnreadCount: () => api.get('/conversations/unread-count'),
  startPatient: (clinicId) => api.post('/conversations/patient', { clinicId }),
  startClinic: (patientId) => api.post('/conversations/clinic', { patientId }),
  getMessages: (id) => api.get(`/conversations/${id}/messages`),
  sendMessage: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/conversations/${id}/messages`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/conversations/${id}/messages`, data);
  },
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications/all'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getClinics: (params) => api.get('/admin/clinics', { params }),
  getClinic: (id) => api.get(`/admin/clinics/${id}`),
  createClinic: (data) => api.post('/admin/clinics', data),
  updateClinic: (id, data) => api.put(`/admin/clinics/${id}`, data),
  approveClinic: (id) => api.put(`/admin/clinics/${id}/approve`),
  toggleClinic: (id) => api.put(`/admin/clinics/${id}/toggle`),
  deleteClinic: (id) => api.delete(`/admin/clinics/${id}`),
  getAllMedicalRecords: (params) => api.get('/admin/medical-records', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
};
