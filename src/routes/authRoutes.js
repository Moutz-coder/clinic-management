const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('الاسم مطلوب').isLength({ min: 2, max: 100 }).withMessage('الاسم يجب أن يكون بين 2 و 100 حرف'),
  body('email').trim().isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
  body('password').isLength({ min: 6, max: 128 }).withMessage('كلمة المرور يجب أن تكون بين 6 و 128 حرف'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

const doctorLoginValidation = [
  body('clinicEmail').trim().isEmail().withMessage('البريد الإلكتروني غير صالح'),
  body('doctorId').notEmpty().withMessage('معرف الطبيب مطلوب'),
  body('pin').isLength({ min: 6, max: 6 }).withMessage('رمز الدخول يجب أن يكون 6 أرقام').isNumeric().withMessage('رمز الدخول يجب أن يكون أرقاماً فقط'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 6, max: 128 }).withMessage('كلمة المرور الجديدة يجب أن تكون بين 6 و 128 حرف'),
];

router.post('/register/patient', registerValidation, authController.registerPatient);
router.post('/register/clinic', registerValidation, authController.registerClinic);
router.get('/center-doctors', authController.getCenterDoctors);
router.post('/doctor-login', doctorLoginValidation, authController.doctorLogin);
router.post('/login', loginValidation, authController.login);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, changePasswordValidation, authController.changePassword);

module.exports = router;
