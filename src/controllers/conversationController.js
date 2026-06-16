const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { createNotification } = require('../utils/helpers');
const {
  tryConfirmFromChatMessage,
} = require('../utils/appointmentBooking');

const getOrCreateConversation = async (patientId, clinicId) => {
  let conversation = await Conversation.findOne({ patientId, clinicId });
  if (!conversation) {
    conversation = await Conversation.create({ patientId, clinicId });
  }
  return conversation;
};

const countUnread = async (conversation, userId, role) => {
  const lastRead = role === 'patient' ? conversation.patientLastReadAt : conversation.clinicLastReadAt;
  const query = {
    conversationId: conversation._id,
    senderId: { $ne: userId },
  };
  if (lastRead) query.createdAt = { $gt: lastRead };
  return Message.countDocuments(query);
};

// @desc    بدء أو جلب محادثة (مريض)
exports.startConversation = async (req, res, next) => {
  try {
    const { clinicId } = req.body;
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'العيادة غير موجودة' });
    }

    const conversation = await getOrCreateConversation(req.patient._id, clinicId);
    const populated = await Conversation.findById(conversation._id)
      .populate('clinicId', 'name phone')
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } });

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    بدء أو جلب محادثة (عيادة)
exports.startConversationClinic = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const conversation = await getOrCreateConversation(patientId, req.clinic._id);
    const populated = await Conversation.findById(conversation._id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } });

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    عدد الرسائل غير المقروءة
exports.getUnreadCount = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ success: true, data: { count: 0 } });
    }

    let conversations;
    if (req.user.role === 'patient') {
      conversations = await Conversation.find({ patientId: req.patient._id });
    } else {
      conversations = await Conversation.find({ clinicId: req.clinic._id });
    }

    let count = 0;
    for (const conv of conversations) {
      count += await countUnread(conv, req.user._id, req.user.role);
    }

    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// @desc    قائمة المحادثات
exports.getConversations = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'patient') {
      query = { patientId: req.patient._id };
    } else {
      query = { clinicId: req.clinic._id };
    }

    const conversations = await Conversation.find(query)
      .populate('clinicId', 'name phone')
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
      .sort({ lastMessageAt: -1 });

    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await countUnread(conv, req.user._id, req.user.role);
        return { ...conv.toObject(), unreadCount };
      })
    );

    const totalUnread = withUnread.reduce((sum, c) => sum + c.unreadCount, 0);

    res.json({ success: true, data: withUnread, unreadTotal: totalUnread });
  } catch (error) {
    next(error);
  }
};

// @desc    رسائل محادثة
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
    }

    const isPatient = req.user.role === 'patient' && conversation.patientId.toString() === req.patient._id.toString();
    const isClinic = req.user.role === 'clinic' && conversation.clinicId.toString() === req.clinic._id.toString();

    if (!isPatient && !isClinic) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    if (isPatient) {
      conversation.patientLastReadAt = new Date();
    } else {
      conversation.clinicLastReadAt = new Date();
    }
    await conversation.save();

    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'name role')
      .populate('appointmentId', 'status appointmentDate')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    إرسال رسالة
exports.sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
    }

    const isPatient = req.user.role === 'patient' && conversation.patientId.toString() === req.patient._id.toString();
    const isClinic = req.user.role === 'clinic' && conversation.clinicId.toString() === req.clinic._id.toString();

    if (!isPatient && !isClinic) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const { message } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!message && !imageUrl) {
      return res.status(400).json({ success: false, message: 'الرسالة أو الصورة مطلوبة' });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      message: message || '',
      imageUrl,
      type: 'text',
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    if (req.user.role === 'patient') {
      await tryConfirmFromChatMessage(conversation, req.patient._id, message, req.user._id);
    }

    if (req.user.role === 'clinic') {
      const pending = await Appointment.findOne({
        patientId: conversation.patientId,
        clinicId: conversation.clinicId,
        status: 'pending_confirmation',
      }).sort({ confirmationRequestedAt: -1 });

      if (pending && message) {
        pending.confirmationRequestedAt = new Date();
        await pending.save();
      }
    }

    let notifyUserId;
    if (req.user.role === 'patient') {
      const clinic = await Clinic.findById(conversation.clinicId);
      notifyUserId = clinic?.userId;
    } else {
      const patient = await Patient.findById(conversation.patientId);
      notifyUserId = patient?.userId;
    }

    if (notifyUserId) {
      await createNotification({
        userId: notifyUserId,
        title: 'رسالة جديدة',
        message: `رسالة جديدة من ${req.user.name}`,
        type: 'new_message',
        relatedId: conversation._id,
      });
    }

    const populated = await Message.findById(newMessage._id).populate('senderId', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
