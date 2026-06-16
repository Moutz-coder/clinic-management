import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../api/services';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ToggleActionButton from '../../components/ToggleActionButton';
import { Users } from 'lucide-react';
import { roleLabels } from '../../utils/helpers';

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? { role: roleFilter } : {};
      const { data } = await adminAPI.getUsers(params);
      setUsers(data.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [roleFilter]);

  const toggle = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('تم تحديث الحالة');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">إدارة المستخدمين</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'patient', 'clinic', 'admin'].map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-2 rounded-xl text-sm font-medium ${roleFilter === r ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {r === '' ? 'الكل' : roleLabels[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مستخدمين" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="text-right p-4 font-medium">الاسم</th>
                <th className="text-right p-4 font-medium">الهاتف</th>
                <th className="text-right p-4 font-medium">الدور</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-50">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4" dir="ltr">{u.phone}</td>
                  <td className="p-4"><span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{roleLabels[u.role]}</span></td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role !== 'admin' && (
                      <ToggleActionButton isActive={u.isActive} onClick={() => toggle(u._id)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
