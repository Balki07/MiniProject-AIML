// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import { LanguageProvider } from './context/LanguageContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PostAdPage = lazy(() => import('./pages/PostAdPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminLayoutBuilderPage = lazy(() => import('./pages/AdminLayoutBuilderPage'));
const AdminAdHistoryPage = lazy(() => import('./pages/AdminAdHistoryPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const DepartmentBoardPage = lazy(() => import('./pages/DepartmentBoardPage'));
const AdDetailsPage = lazy(() => import('./pages/AdDetailsPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

const App = () => (
  <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<div className="min-h-screen pt-24 flex items-center justify-center text-white/60">Loading...</div>}>
          <Routes>
            <Route path="/"          element={<LandingPage />} />
            <Route path="/ads"       element={<Navigate to="/dashboard" replace />} />
            <Route path="/ads/:id"   element={<AdDetailsPage />} />
            <Route path="/department/:slug" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/register"  element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route path="/dashboard" element={<DepartmentBoardPage defaultSlug="dashboard" />} />
            <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/post-ad"   element={<ProtectedRoute><PostAdPage /></ProtectedRoute>} />
            <Route path="/admin"     element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/layout" element={<AdminRoute><AdminLayoutBuilderPage /></AdminRoute>} />
            <Route path="/admin/history" element={<AdminRoute><AdminAdHistoryPage /></AdminRoute>} />

            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
);

export default App;
