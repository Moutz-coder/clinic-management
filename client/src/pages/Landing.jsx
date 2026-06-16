import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Shield, Search, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const features = [
  { icon: Search, title: 'ابحث واحجز', desc: 'تصفّح العيادات واحجز موعدك بسرعة وسهولة' },
  { icon: Calendar, title: 'مواعيدك', desc: 'تابع حجوزاتك وتذكيراتك في مكان واحد منظم' },
  { icon: Shield, title: 'آمن ومنظم', desc: 'سجلات طبية محمية بالكامل وإدارة سهلة للعيادات' },
  { icon: MessageCircle, title: 'تواصل مباشر', desc: 'محادثات فورية مع العيادات والأطباء' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm mb-6">
              <Stethoscope className="w-4 h-4" />
              نظام إدارة العيادات الطبية
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              احجز موعدك الطبي
              <span className="block text-primary-200">بكل سهولة وأمان</span>
            </h1>
            <p className="text-lg text-primary-100 mb-8 leading-relaxed">
              منصة بسيطة للمرضى والعيادات — حجز مواعيد، إدارة مرضى، ودخول سريع للأطباء.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/clinics" className="px-8 py-3.5 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                تصفح العيادات
              </Link>
              <Link to="/login" className="px-8 py-3.5 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">لماذا عيادتي؟</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">نوفر لك تجربة سلسة لحجز المواعيد وإدارة رعايتك الصحية</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-primary-200 transition-all group">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <f.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">للعيادات والأطباء</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">سجّل عيادتك أو ادخل كطبيب من صفحة واحدة بسيطة وآمنة</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register/clinic" className="px-8 py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-400 transition shadow-lg shadow-primary-500/30">
              تسجيل عيادة جديدة
            </Link>
            <Link to="/login?tab=doctor" className="px-8 py-4 border-2 border-white/30 rounded-xl font-bold hover:bg-white/10 transition">
              دخول الطبيب
            </Link>
            <Link to="/login" className="px-8 py-4 border-2 border-white/30 rounded-xl font-bold hover:bg-white/10 transition">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">عيادتي</span>
          </div>
          <p className="mb-2">© 2026 عيادتي - نظام إدارة العيادات الطبية وحجز المواعيد</p>
          <p className="text-xs text-slate-400">مشروع تخرج جامعي - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
