import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileText, Search, Filter, User, Calendar, Building2, Stethoscope } from 'lucide-react';

export default function AdminMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClinic, setFilterClinic] = useState('');
  const [filterPatient, setFilterPatient] = useState('');

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const { data } = await adminAPI.getAllMedicalRecords({
          clinicId: filterClinic || undefined,
          patientId: filterPatient || undefined,
        });
        setRecords(data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'فشل تحميل السجلات الطبية');
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, [filterClinic, filterPatient]);

  const filteredRecords = records.filter((record) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        record.patientId?.userId?.name?.toLowerCase().includes(search) ||
        record.clinicId?.name?.toLowerCase().includes(search) ||
        record.doctorId?.name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary-600" />
        السجلات الطبية
      </h1>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="تصفية بالعيادة..."
              value={filterClinic}
              onChange={(e) => setFilterClinic(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary-500"
            />
            <input
              type="text"
              placeholder="تصفية بالمريض..."
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد سجلات طبية</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record._id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">المريض</p>
                    <p className="font-semibold text-slate-800">{record.patientId?.userId?.name || 'غير معروف'}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{record.patientId?.userId?.phone || ''}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">العيادة</p>
                    <p className="font-semibold text-slate-800">{record.clinicId?.name || 'غير معروف'}</p>
                  </div>
                </div>

                {record.doctorId && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">الطبيب</p>
                      <p className="font-semibold text-slate-800">{record.doctorId.name || 'غير معروف'}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">التاريخ</p>
                    <p className="font-semibold text-slate-800">
                      {new Date(record.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {record.diagnosis && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-2">التشخيص:</p>
                  <p className="text-sm text-slate-600">{record.diagnosis}</p>
                </div>
              )}

              {record.notes && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-700 mb-2">ملاحظات:</p>
                  <p className="text-sm text-slate-600">{record.notes}</p>
                </div>
              )}

              {record.medications && record.medications.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-700 mb-2">الأدوية:</p>
                  <div className="flex flex-wrap gap-2">
                    {record.medications.map((med, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-700">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
