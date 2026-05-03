// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      toast.success(t('register.toast.created'));
      navigate('/profile');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || t('register.toast.failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-hero-gradient">
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-fuchsia-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(255,95,122,0.26)]">
              <Zap size={24} className="text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('register.title')}</h1>
            <p className="text-white/50 text-sm mt-1">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{t('register.fullName')}</label>
              <input type="text" className="input-field" placeholder={t('register.fullNamePlaceholder')} value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{t('register.email')}</label>
              <input type="email" className="input-field" placeholder={t('register.emailPlaceholder')} value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{t('register.phone')} <span className="text-white/30">({t('register.optional')})</span></label>
              <input type="tel" className="input-field" placeholder={t('register.phonePlaceholder')} value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{t('register.password')}</label>
              <input type="password" className="input-field" placeholder={t('register.passwordPlaceholder')} value={form.password} onChange={set('password')} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? t('register.creating') : t('register.createAccount')}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">{t('register.signIn')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
