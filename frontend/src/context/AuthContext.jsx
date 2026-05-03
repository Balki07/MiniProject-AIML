// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const getTokenStorage = () => (isLocalhost ? window.sessionStorage : window.localStorage);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const tokenStorage = getTokenStorage();
    if (isLocalhost) {
      window.localStorage.removeItem('token');
    }

    const token = tokenStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      window.localStorage.removeItem('token');
      window.sessionStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = ({ user, token }) => {
    const tokenStorage = getTokenStorage();
    tokenStorage.setItem('token', token);
    if (tokenStorage === window.localStorage) {
      window.sessionStorage.removeItem('token');
    } else {
      window.localStorage.removeItem('token');
    }
    setUser(user);
  };

  const logout = () => {
    window.localStorage.removeItem('token');
    window.sessionStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
