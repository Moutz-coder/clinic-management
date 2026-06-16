const mongoose = require('mongoose');
const User = require('../models/User');

const migrateDatabase = async () => {
  const db = mongoose.connection.db;
  if (!db) return;

  const users = db.collection('users');

  await users.updateMany({ $or: [{ phone: '' }, { phone: null }] }, { $unset: { phone: '' } });

  try {
    await users.dropIndex('phone_1');
    console.log('تم إزالة فهرس الهاتف القديم');
  } catch (error) {
    if (error.code !== 27 && error.codeName !== 'IndexNotFound') {
      console.warn('تخطّي إزالة فهرس الهاتف:', error.message);
    }
  }

  await User.syncIndexes();
};

module.exports = migrateDatabase;
