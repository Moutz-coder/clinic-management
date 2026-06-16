import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationAPI, notificationAPI } from '../api/services';
import {
  Stethoscope, LogOut, Bell, Menu, X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar({ links = [], showNotifications = true }) {
  const { user, activeDoctor, isDoctorSession, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const previousNotificationCount = useRef(0);
  const audioRef = useRef(null);

  // إنشاء صوت الإشعار
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setChatUnread(0);
      setNotificationUnread(0);
      return;
    }
    const load = () => {
      conversationAPI.getUnreadCount()
        .then(({ data }) => setChatUnread(data.data?.count || 0))
        .catch(() => setChatUnread(0));
      notificationAPI.getAll()
        .then(({ data }) => {
          const unread = data.data?.filter(n => !n.isRead).length || 0;
          setNotificationUnread(unread);
          // تشغيل الصوت عند وصول إشعار جديد
          if (unread > previousNotificationCount.current && previousNotificationCount.current >= 0) {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          }
          previousNotificationCount.current = unread;
        })
        .catch(() => setNotificationUnread(0));
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderBadge = (link) => {
    if (!link.to.includes('/chat') || chatUnread <= 0) return null;
    return (
      <span className="min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {chatUnread > 99 ? '99+' : chatUnread}
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 hidden sm:block">عيادتي</span>
            </NavLink>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {renderBadge(link)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showNotifications && user && user.role !== 'admin' && (
              <NavLink to={`/${user.role}/notifications`} className="p-2 rounded-xl hover:bg-slate-100 relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {notificationUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notificationUnread > 99 ? '99+' : notificationUnread}
                  </span>
                )}
              </NavLink>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    {isDoctorSession && activeDoctor ? activeDoctor.name : user.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.role === 'patient' ? 'مريض' : user.role === 'clinic' ? (isDoctorSession ? 'طبيب' : 'عيادة') : 'مدير'}
                  </p>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50 text-red-500" title="تسجيل الخروج">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <NavLink to="/login" className="px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-xl">دخول</NavLink>
                <NavLink to="/register/patient" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700">تسجيل</NavLink>
              </div>
            )}
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden pb-4 flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600'
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {renderBadge(link)}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
