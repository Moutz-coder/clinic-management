const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const patientBelongsToClinic = async (patientId, clinicId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) return false;
  if (patient.clinicIds.some((id) => id.toString() === clinicId.toString())) return true;
  return Appointment.exists({ clinicId, patientId });
};

const createNotification = async ({ userId, title, message, type = 'general', relatedId = null }) => {
  try {
    await Notification.create({ userId, title, message, type, relatedId });
  } catch (error) {
    console.error('فشل إنشاء الإشعار:', error.message);
  }
};

const generateToken = (userId, extra = {}) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId, ...extra }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateDoctorPin = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = { createNotification, generateToken, generateDoctorPin, patientBelongsToClinic };
