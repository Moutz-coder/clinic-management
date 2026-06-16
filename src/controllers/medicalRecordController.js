const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const { patientBelongsToClinic } = require('../utils/helpers');

// @desc    سجلات المريض (جميع العيادات)
exports.getMyRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.patient._id })
      .populate('clinicId', 'name facilityType')
      .sort({ visitDate: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    إضافة زيارة طبية
exports.createMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, visitDate, reason, diagnosis, treatment, notes, appointmentId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'المريض غير موجود' });
    }

    const hasRelation = await patientBelongsToClinic(patientId, req.clinic._id);

    if (!hasRelation) {
      return res.status(403).json({ success: false, message: 'لا يمكن إضافة سجل لهذا المريض' });
    }

    const record = await MedicalRecord.create({
      patientId,
      clinicId: req.clinic._id,
      visitDate: visitDate || new Date(),
      reason,
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      notes: notes || '',
      appointmentId: appointmentId || null,
    });

    res.status(201).json({ success: true, message: 'تم إضافة السجل الطبي', data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض سجلات مريض داخل العيادة
exports.getPatientRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const records = await MedicalRecord.find({
      patientId,
      clinicId: req.clinic._id,
    }).sort({ visitDate: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    عرض سجل طبي واحد
exports.getMedicalRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      clinicId: req.clinic._id,
    }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } });

    if (!record) {
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث سجل طبي
exports.updateMedicalRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      clinicId: req.clinic._id,
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    }

    const { reason, diagnosis, treatment, notes, visitDate } = req.body;
    if (reason) record.reason = reason;
    if (diagnosis !== undefined) record.diagnosis = diagnosis;
    if (treatment !== undefined) record.treatment = treatment;
    if (notes !== undefined) record.notes = notes;
    if (visitDate) record.visitDate = visitDate;

    await record.save();
    res.json({ success: true, message: 'تم تحديث السجل', data: record });
  } catch (error) {
    next(error);
  }
};
