import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function DashboardLayout({ links }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar links={links} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
