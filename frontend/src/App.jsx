// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import TrustedFeedPage     from './pages/TrustedFeedPage';
import PostAdPage          from './pages/PostAdPage';
import UserDashboardPage   from './pages/UserDashboardPage';
import AdminDashboardPage  from './pages/AdminDashboardPage';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/ads"       element={<TrustedFeedPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
        <Route path="/post-ad"   element={<ProtectedRoute><PostAdPage /></ProtectedRoute>} />
        <Route path="/admin"     element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          duration: 4000,
        }}
      />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
