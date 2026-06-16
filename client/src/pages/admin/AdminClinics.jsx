import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ToggleActionButton from '../../components/ToggleActionButton';
import { Building2, Check, Plus, Trash2, Pencil } from 'lucide-react';

const facilityLabels = { private: 'عيادة خاصة', hospital: 'مستشفى' };

export default function AdminClinics() {
  const [searchParams] = useSearchParams();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || '');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await adminAPI.getClinics(params);
      setClinics(data.data);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [filter]);

  const approve = async (id) => {
    try {
      await adminAPI.approveClinic(id);
      toast.success('تمت الموافقة');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل');
    }
  };

  const toggle = async (id) => {
    try {
      await adminAPI.toggleClinic(id);
      toast.success('تم تحديث الحالة');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل');
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف عيادة "${name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await adminAPI.deleteClinic(id);
      toast.success('تم حذف العيادة');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحذف');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">إدارة العيادات</h1>
        <Link
          to="/admin/clinics/create"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إنشاء عيادة جديدة
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ k: '', l: 'الكل' }, { k: 'pending', l: 'بانتظار الموافقة' }, { k: 'approved', l: 'معتمدة' }].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-medium ${filter === f.k ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : clinics.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد عيادات" />
      ) : (
        <div className="space-y-4">
          {clinics.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <p className="text-sm text-slate-500">{c.address}</p>
                  <p className="text-sm text-slate-400 mt-1">المسؤول: {c.userId?.name} • <span dir="ltr">{c.userId?.phone}</span></p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      {facilityLabels[c.facilityType] || 'عيادة خاصة'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.isApproved ? 'معتمدة' : 'بانتظار الموافقة'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'نشطة' : 'معطلة'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/clinics/${c._id}/edit`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 border border-primary-700"
                  >
                    <Pencil className="w-4 h-4" /> تعديل
                  </Link>
                  {!c.isApproved && (
                    <button onClick={() => approve(c._id)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 border border-green-700">
                      <Check className="w-4 h-4" /> موافقة
                    </button>
                  )}
                  <ToggleActionButton isActive={c.isActive} onClick={() => toggle(c._id)} />
                  <button
                    onClick={() => remove(c._id, c.name)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 border border-red-700"
                  >
                    <Trash2 className="w-4 h-4" /> حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
