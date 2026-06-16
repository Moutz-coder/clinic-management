import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/services';
import { toast } from '../components/Toast';
import { Stethoscope, Eye, EyeOff, Mail, Lock, UserCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { MEDICAL_CATEGORIES } from '../config/specialtyCategories';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition';

export default function Login() {
  const { login, doctorLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('tab') === 'doctor' ? 'doctor' : 'account');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [accountForm, setAccountForm] = useState({ email: '', password: '' });
  const [doctorEmail, setDoctorEmail] = useState('');
  const [centerInfo, setCenterInfo] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [pin, setPin] = useState('');

  const justRegistered = searchParams.get('registered') === 'clinic';
  const pendingClinic = location.state?.pendingClinic;

  useEffect(() => {
    if (searchParams.get('tab') === 'doctor') setMode('doctor');
  }, [searchParams]);

  useEffect(() => {
    if (justRegistered) {
      toast.success('تم إرسال طلب التسجيل. انتظر موافقة الإدارة ثم سجّل دخولك.');
    } else if (pendingClinic) {
      toast.error('حساب العيادة بانتظار موافقة الإدارة');
    }
  }, [justRegistered, pendingClinic]);

  const getCategoryLabel = (id) => MEDICAL_CATEGORIES.find((c) => c.id === id)?.label;

  const handleAccountLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(accountForm.email, accountForm.password);
      toast.success('تم تسجيل الدخول بنجاح');
      const routes = { patient: '/patient/appointments', clinic: '/clinic/dashboard', admin: '/admin/dashboard' };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async (e) => {
    e.preventDefault();
    if (!doctorEmail.trim()) {
      toast.error('أدخل البريد الإلكتروني');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.getCenterDoctors(doctorEmail.trim());
      setCenterInfo(data.data);
      setSelectedDoctorId('');
      setPin('');
    } catch (err) {
      setCenterInfo(null);
      toast.error(err.response?.data?.message || 'تعذّر العثور على العيادة');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('اختر اسمك');
      return;
    }
    if (!/^\d{6}$/.test(pin.replace(/\D/g, ''))) {
      toast.error('رمز الدخول 6 أرقام');
      return;
    }
    setLoading(true);
    try {
      await doctorLogin({
        clinicEmail: doctorEmail.trim(),
        doctorId: selectedDoctorId,
        pin,
      });
      toast.success('مرحباً بك');
      navigate('/clinic/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'رمز الدخول غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">عيادتي</h1>
          <p className="text-slate-500 text-sm mt-1">سجّل دخولك بسهولة</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-2 p-1.5 m-4 mb-0 bg-slate-100 rounded-2xl">
            {[
              { k: 'account', l: 'حسابي' },
              { k: 'doctor', l: 'طبيب' },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => { setMode(t.k); setCenterInfo(null); }}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === t.k ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="p-6 pt-5">
            {(justRegistered || pendingClinic) && mode === 'account' && (
              <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                {justRegistered
                  ? 'طلب العيادة قيد المراجعة. انتظر موافقة الإدارة.'
                  : 'حساب العيادة بانتظار الموافقة.'}
              </div>
            )}

            {mode === 'account' ? (
              <form onSubmit={handleAccountLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      className={`${inputCls} pr-11`}
                      placeholder="name@email.com"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={accountForm.password}
                      onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                      className={`${inputCls} pr-11 pl-11`}
                      placeholder="••••••••"
                      required
                      dir="ltr"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-60 flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'دخول'}
                </button>
              </form>
            ) : (
              <form onSubmit={centerInfo ? handleDoctorLogin : loadDoctors} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">إيميل العيادة</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={doctorEmail}
                      onChange={(e) => { setDoctorEmail(e.target.value); setCenterInfo(null); }}
                      className={`${inputCls} pr-11`}
                      placeholder="center@email.com"
                      required
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">إيميل مسؤول العيادة الذي أنشأ الحساب</p>
                </div>

                {!centerInfo ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-60 flex items-center justify-center"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'متابعة'}
                  </button>
                ) : (
                  <>
                    <div className="px-4 py-3 bg-primary-50 rounded-xl">
                      <p className="text-sm font-semibold text-primary-800">{centerInfo.clinicName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">اختر اسمك</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {centerInfo.doctors.map((doc) => (
                          <button
                            key={doc._id}
                            type="button"
                            onClick={() => setSelectedDoctorId(doc._id)}
                            className={`w-full text-right p-3 rounded-xl border-2 transition ${
                              selectedDoctorId === doc._id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-slate-100 hover:border-primary-200'
                            }`}
                          >
                            <p className="font-semibold text-slate-800 text-sm">{doc.name}</p>
                            <p className="text-xs text-slate-500">{getCategoryLabel(doc.specialty) || 'طبيب'}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">رمز الدخول</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`${inputCls} text-center text-lg tracking-[0.5em]`}
                        placeholder="••••••"
                        required
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedDoctorId}
                      className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : <><UserCircle className="w-5 h-5" /> دخول</>}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-6 space-y-2 text-sm text-slate-500">
          <p>
            مريض جديد؟{' '}
            <Link to="/register/patient" className="text-primary-600 font-semibold">إنشاء حساب</Link>
          </p>
          <p>
            عيادة جديدة؟{' '}
            <Link to="/register/clinic" className="text-primary-600 font-semibold">طلب تسجيل</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
