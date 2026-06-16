import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useClinicPage } from '../../../context/ClinicPageContext';
import { conversationAPI } from '../../../api/services';
import { toast } from '../../../components/Toast';
import { MapPin, Phone, MessageCircle } from 'lucide-react';

export default function ClinicContact() {
  const { clinic, clinicId } = useClinicPage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChat = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'patient') {
      toast.error('يجب تسجيل الدخول كمريض');
      return;
    }
    try {
      const { data } = await conversationAPI.startPatient(clinicId);
      navigate(`/patient/chat/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل بدء المحادثة');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">معلومات التواصل</h2>
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <MapPin className="w-6 h-6 text-primary-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">العنوان</p>
              <p className="text-slate-600 mt-1">{clinic.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <Phone className="w-6 h-6 text-primary-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">الهاتف</p>
              <a href={`tel:${clinic.phone}`} className="text-primary-600 mt-1 block" dir="ltr">{clinic.phone}</a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-l from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h3 className="text-xl font-bold mb-2">تواصل مع {clinic.name}</h3>
        <p className="text-primary-100 mb-6 text-sm">أرسل رسالة للعيادة مباشرة عبر المحادثات</p>
        <button
          onClick={handleChat}
          className="px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors"
        >
          بدء المحادثة
        </button>
      </div>
    </div>
  );
}
