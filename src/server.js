require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { expirePendingAppointments } = require('./utils/appointmentBooking');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
    console.log(`الرابط: http://localhost:${PORT}/api/health`);
  });

  expirePendingAppointments();
  setInterval(expirePendingAppointments, 5 * 60 * 1000);
});
