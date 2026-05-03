// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      toast.success(t('login.toast.welcomeBack', { name: data.user.name }));
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('login.toast.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(19,196,255,0.32)]">
              <Zap size={24} className="text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('login.title')}</h1>
            <p className="text-white/50 text-sm mt-1">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{t('login.email')}</label>
              <input
                type="email"
                className="input-field"
                placeholder={t('login.emailPlaceholder')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder={t('login.passwordPlaceholder')}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Admin hint */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400/80">
              <strong>{t('login.adminHintLabel')}</strong> admin@adexpress.com / Admin@123456
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">{t('login.createOne')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
