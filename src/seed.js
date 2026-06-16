require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Clinic = require('./models/Clinic');
const Patient = require('./models/Patient');

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany(), Clinic.deleteMany(), Patient.deleteMany()]);

  const adminPassword = await bcrypt.hash('admin123', 12);
  await User.create({
    name: 'المدير',
    email: 'admin@clinic.ly',
    phone: '0500000000',
    password: adminPassword,
    role: 'admin',
  });

  const patientPassword = await bcrypt.hash('patient123', 12);
  const patientUser = await User.create({
    name: 'معتز',
    email: 'patient@clinic.ly',
    phone: '0511111111',
    password: patientPassword,
    role: 'patient',
  });
  await Patient.create({
    userId: patientUser._id,
    birthDate: new Date('1990-05-15'),
    gender: 'male',
  });

  const clinicPassword = await bcrypt.hash('clinic123', 12);
  const clinicUser = await User.create({
    name: 'مسؤول مركز النور',
    email: 'center@clinic.ly',
    phone: '0522222222',
    password: clinicPassword,
    role: 'clinic',
  });

  const clinic = await Clinic.create({
    userId: clinicUser._id,
    name: 'مركز النور الطبي',
    facilityType: 'hospital',
    description: 'مركز طبي متكامل يضم نخبة من الأطباء في تخصصات متعددة',
    address: 'صبراته، شارع عمر المختار',
    phone: '0912345678',
    specialties: ['general', 'pediatrics', 'cardiology'],
    workingHours: [
      { day: 'sunday', open: '08:00', close: '16:00', isOpen: true },
      { day: 'monday', open: '08:00', close: '16:00', isOpen: true },
      { day: 'tuesday', open: '08:00', close: '16:00', isOpen: true },
      { day: 'wednesday', open: '08:00', close: '16:00', isOpen: true },
      { day: 'thursday', open: '08:00', close: '16:00', isOpen: true },
      { day: 'friday', open: '00:00', close: '00:00', isOpen: false },
      { day: 'saturday', open: '09:00', close: '13:00', isOpen: true },
    ],
    doctors: [
      {
        name: 'د. سارة العتيبي',
        specialty: 'general',
        degree: 'دكتوراه',
        rank: 'أخصائية',
        gender: 'female',
        city: 'صبراته',
        availableForConsultation: true,
        rating: 4.8,
        ratingCount: 12,
        bio: 'متخصصة في الطب العام وطب الأسرة',
        accessPin: '123456',
        hasAccessPin: true,
      },
      {
        name: 'د. أحمد المنصوري',
        specialty: 'pediatrics',
        degree: 'ماجستير',
        rank: 'أخصائي',
        gender: 'male',
        city: 'صبراته',
        availableForConsultation: true,
        rating: 4.5,
        ratingCount: 8,
        bio: 'متخصص في طب الأطفال وحديثي الولادة',
        accessPin: '123456',
        hasAccessPin: true,
      },
      {
        name: 'د. فاطمة الزروق',
        specialty: 'cardiology',
        degree: 'دكتوراه',
        rank: 'استشارية',
        gender: 'female',
        city: 'صبراته',
        availableForConsultation: false,
        rating: 4.9,
        ratingCount: 20,
        bio: 'متخصصة في أمراض القلب والشرايين',
        accessPin: '123456',
        hasAccessPin: true,
      },
    ],
    isApproved: true,
  });

  console.log('تم إنشاء البيانات التجريبية:');
  console.log('المدير: admin@clinic.ly / admin123');
  console.log('المريض: patient@clinic.ly / patient123');
  console.log('مسؤول المركز: center@clinic.ly / clinic123');
  console.log('الطبيب: center@clinic.ly + اختر الطبيب + رمز 123456');
  console.log('المركز:', clinic.name, `(${clinic.doctors.length} أطباء)`);

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
