import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeDoctor, setActiveDoctor] = useState(() => {
    const saved = localStorage.getItem('activeDoctor');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDoctorSession, setIsDoctorSession] = useState(() => localStorage.getItem('isDoctorSession') === 'true');
  const [loading, setLoading] = useState(true);

  const saveSession = (userData, profileData, token, doctorData = null, doctorSession = false) => {
    setUser(userData);
    setProfile(profileData);
    setActiveDoctor(doctorData);
    setIsDoctorSession(doctorSession);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('profile', JSON.stringify(profileData));
    localStorage.setItem('token', token);
    if (doctorData) {
      localStorage.setItem('activeDoctor', JSON.stringify(doctorData));
    } else {
      localStorage.removeItem('activeDoctor');
    }
    localStorage.setItem('isDoctorSession', String(doctorSession));
  };

  const clearSession = () => {
    setUser(null);
    setProfile(null);
    setActiveDoctor(null);
    setIsDoctorSession(false);
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    localStorage.removeItem('token');
    localStorage.removeItem('activeDoctor');
    localStorage.removeItem('isDoctorSession');
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    saveSession(data.data.user, data.data.profile, data.data.token);
    return data.data;
  };

  const doctorLogin = async (credentials) => {
    const { data } = await authAPI.doctorLogin(credentials);
    const userData = { ...data.data.user, role: data.data.user.role || 'clinic' };
    saveSession(
      userData,
      data.data.profile,
      data.data.token,
      data.data.activeDoctor,
      true,
    );
    return data.data;
  };

  const registerPatient = async (formData) => {
    const { data } = await authAPI.registerPatient(formData);
    saveSession(data.data.user, data.data.patient, data.data.token);
    return data.data;
  };

  const registerClinic = async (formData) => {
    const { data } = await authAPI.registerClinic(formData);
    return data;
  };

  const logout = () => clearSession();

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      if (data.data.user.role === 'clinic' && data.data.profile && !data.data.profile.isApproved) {
        clearSession();
        return;
      }
      setUser(data.data.user);
      setProfile(data.data.profile);
      setActiveDoctor(data.data.activeDoctor || null);
      setIsDoctorSession(Boolean(data.data.isDoctorSession));
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('profile', JSON.stringify(data.data.profile));
      if (data.data.activeDoctor) {
        localStorage.setItem('activeDoctor', JSON.stringify(data.data.activeDoctor));
        localStorage.setItem('isDoctorSession', 'true');
      } else {
        localStorage.removeItem('activeDoctor');
        localStorage.setItem('isDoctorSession', 'false');
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeDoctor,
        isDoctorSession,
        loading,
        login,
        doctorLogin,
        logout,
        registerPatient,
        registerClinic,
        refreshUser,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
