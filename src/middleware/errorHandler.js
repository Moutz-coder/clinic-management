const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const messages = {
      email: 'البريد الإلكتروني مسجل مسبقاً',
      phone: 'رقم الهاتف مسجل مسبقاً',
    };
    return res.status(400).json({
      success: false,
      message: messages[field] || 'هذه البيانات مسجلة مسبقاً',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'معرف غير صالح' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'خطأ في الخادم',
  });
};

module.exports = errorHandler;
