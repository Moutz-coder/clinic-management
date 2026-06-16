import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { clinicAPI, medicalAPI } from '../../api/services';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { ArrowRight, FileText, User, Phone, Calendar, Mail, MapPin, Activity } from 'lucide-react';
import { formatDateTime, genderLabels } from '../../utils/helpers';

export default function PatientDetail() {
  const { patientId } = useParams();
  const [data, setData] = useState(null);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, recsRes] = await Promise.allSettled([
          clinicAPI.getPatient(patientId),
          medicalAPI.getByPatient(patientId),
        ]);
        if (profileRes.status === 'fulfilled') {
          setData(profileRes.value.data.data);
        } else {
          setData(null);
        }
        if (recsRes.status === 'fulfilled') {
          setRecordCount(recsRes.value.data.data?.length || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!data) return <p className="text-center text-slate-500 py-20">المريض غير موجود</p>;

  const patient = data.patient;
  const appointments = data.appointments || [];

  return (
    <div>
      <Link to="/clinic/patients" className="text-primary-600 text-sm font-medium hover:underline mb-6 inline-flex items-center gap-1">
        <ArrowRight className="w-4 h-4" /> العودة للمرضى
      </Link>

      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-primary-200">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{patient?.userId?.name || 'مريض'}</h1>
            <p className="text-primary-100 text-sm mt-1">رقم الملف: {patientId.slice(-8)}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {patient?.userId?.phone && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">رقم الهاتف</p>
              <p className="font-semibold text-slate-800" dir="ltr">{patient.userId.phone}</p>
            </div>
          </div>
        )}
        {patient?.userId?.email && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">البريد الإلكتروني</p>
              <p className="font-semibold text-slate-800 text-sm" dir="ltr">{patient.userId.email}</p>
            </div>
          </div>
        )}
        {patient?.gender && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">الجنس</p>
              <p className="font-semibold text-slate-800">{genderLabels[patient.gender]}</p>
            </div>
          </div>
        )}
        {patient?.birthDate && (
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">تاريخ الميلاد</p>
              <p className="font-semibold text-slate-800">{new Date(patient.birthDate).toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        )}
      </div>

      <Link
        to={`/clinic/patients/${patientId}/medical-record`}
        className="flex items-center justify-between bg-gradient-to-l from-blue-50 to-primary-50 border border-blue-100 rounded-2xl p-5 mb-6 hover:shadow-lg hover:border-blue-200 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">السجل الطبي</h2>
            <p className="text-sm text-slate-500">{recordCount} {recordCount === 1 ? 'زيارة مسجلة' : 'زيارات مسجلة'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary-600 font-medium group-hover:underline">
          <span>عرض السجل</span>
          <ArrowRight className="w-5 h-5" />
        </div>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-slate-600" />
          <h2 className="font-bold text-lg">المواعيد</h2>
        </div>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl">لا توجد مواعيد</p>
          ) : (
            appointments.map((apt) => (
              <div key={apt._id} className="bg-slate-50 rounded-xl p-4 flex justify-between items-center hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-800">{formatDateTime(apt.appointmentDate)}</span>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
