// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  const storage = isLocalhost ? window.sessionStorage : window.localStorage;
  return storage.getItem('token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — but NOT on /auth/* endpoints
// (a failed login also returns 401, we don't want to loop-redirect)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthRoute) {
      window.localStorage.removeItem('token');
      window.sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
