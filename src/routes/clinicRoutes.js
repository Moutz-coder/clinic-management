const express = require('express');
const clinicController = require('../controllers/clinicController');
const { protect, authorize, requireApprovedClinic, requireClinicAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/categories/list', clinicController.getCategories);
router.get('/', clinicController.getClinics);
router.get('/:id', clinicController.getClinicById);
router.post('/:id/view', clinicController.trackDoctorView);
router.post('/:id/rate', protect, authorize('patient'), clinicController.rateDoctor);

router.use(protect, authorize('clinic'), requireApprovedClinic);

router.put('/', requireClinicAdmin, clinicController.updateClinic);
router.post('/image', requireClinicAdmin, upload.single('image'), clinicController.uploadClinicImage);
router.post('/doctor-photo', requireClinicAdmin, upload.single('image'), clinicController.uploadDoctorPhoto);
router.post('/doctors', requireClinicAdmin, clinicController.addDoctor);
router.put('/doctors/:doctorId', requireClinicAdmin, clinicController.updateDoctor);
router.put('/doctors/:doctorId/pin', requireClinicAdmin, clinicController.resetDoctorPin);
router.delete('/doctors/:doctorId', requireClinicAdmin, clinicController.removeDoctor);
router.post('/specialties', requireClinicAdmin, clinicController.addSpecialty);
router.delete('/specialties/:specialty', requireClinicAdmin, clinicController.removeSpecialty);
router.put('/working-hours', requireClinicAdmin, clinicController.updateWorkingHours);
router.put('/general-working-hours', requireClinicAdmin, clinicController.updateGeneralWorkingHours);
router.put('/doctors/:doctorId/working-days', clinicController.updateDoctorWorkingDays);
router.get('/doctors/statistics', requireClinicAdmin, clinicController.getDoctorsStatistics);
router.get('/manage/patients', clinicController.getClinicPatients);
router.get('/manage/patients/:patientId', clinicController.getPatientProfile);
router.post('/manage/patients', clinicController.createPatientFromClinic);
router.get('/manage/dashboard', clinicController.getDashboard);

module.exports = router;
