const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/setup', adminController.createAdmin);

router.use(protect, authorize('admin'));

router.get('/stats', adminController.getGlobalStats);
router.get('/clinics', adminController.getAllClinics);
router.get('/clinics/:id', adminController.getClinicById);
router.post('/clinics', adminController.createClinic);
router.put('/clinics/:id', adminController.updateClinic);
router.put('/clinics/:id/approve', adminController.approveClinic);
router.put('/clinics/:id/toggle', adminController.toggleClinicStatus);
router.delete('/clinics/:id', adminController.deleteClinic);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/toggle', adminController.toggleUserStatus);
router.get('/medical-records', adminController.getAllMedicalRecords);

module.exports = router;
