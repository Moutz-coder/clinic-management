const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/schedule/:clinicId/days', appointmentController.getScheduleDays);
router.get('/schedule/:clinicId', appointmentController.getDaySchedule);
router.get('/available/:clinicId', appointmentController.getAvailableSlots);

router.use(protect);

router.get('/my', authorize('patient'), appointmentController.getMyAppointments);
router.post('/book', authorize('patient'), appointmentController.bookAppointment);
router.put('/:id/confirm', authorize('patient'), appointmentController.confirmAppointmentPatient);
router.put('/:id/cancel', authorize('patient'), appointmentController.cancelAppointment);

router.post('/slots', authorize('clinic'), appointmentController.createAvailableSlots);
router.get('/clinic/schedule', authorize('clinic'), appointmentController.getClinicDaySchedule);
router.post('/clinic/schedule/toggle', authorize('clinic'), appointmentController.toggleScheduleSlot);
router.post('/clinic/schedule/close-day', authorize('clinic'), appointmentController.toggleCloseDay);
router.get('/clinic/available', authorize('clinic'), appointmentController.getClinicAvailableSlots);
router.get('/clinic', authorize('clinic'), appointmentController.getClinicAppointments);
router.post('/clinic/book', authorize('clinic'), appointmentController.bookFromClinic);
router.post('/clinic/walk-in', authorize('clinic'), appointmentController.walkInAppointment);
router.put('/clinic/:id/confirm', authorize('clinic'), appointmentController.confirmAppointmentClinic);
router.post('/clinic/:id/send-confirmation', authorize('clinic'), appointmentController.sendConfirmationRequest);
router.put('/clinic/:id', authorize('clinic'), appointmentController.updateAppointment);
router.put('/clinic/:id/status', authorize('clinic'), appointmentController.updateAppointmentStatus);
router.delete('/clinic/:id', authorize('clinic'), appointmentController.deleteAppointment);

module.exports = router;
