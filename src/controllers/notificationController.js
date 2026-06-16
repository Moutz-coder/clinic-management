const Notification = require('../models/Notification');

// @desc    عرض إشعارات المستخدم
exports.getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    تعليم إشعار كمقروء
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    تعليم جميع الإشعارات كمقروءة
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'تم تعليم جميع الإشعارات كمقروءة' });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف إشعار
exports.deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف الإشعار' });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف جميع الإشعارات
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'تم حذف جميع الإشعارات' });
  } catch (error) {
    next(error);
  }
};
