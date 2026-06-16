require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic_management';
    console.log(`محاولة الاتصال بـ MongoDB...`);
    console.log(`MONGODB_URI: ${mongoUri ? 'تم تعيينه' : 'غير معرف'}`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB متصل: ${conn.connection.host}`);

    const migrateDatabase = require('./migrateDb');
    await migrateDatabase();
  } catch (error) {
    console.error(`خطأ في الاتصال بقاعدة البيانات: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
