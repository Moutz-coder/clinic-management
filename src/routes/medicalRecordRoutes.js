const express = require('express');
const medicalRecordController = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my', authorize('patient'), medicalRecordController.getMyRecords);

router.use(authorize('clinic'));

router.post('/', medicalRecordController.createMedicalRecord);
router.get('/patient/:patientId', medicalRecordController.getPatientRecords);
router.get('/:id', medicalRecordController.getMedicalRecord);
router.put('/:id', medicalRecordController.updateMedicalRecord);

module.exports = router;
