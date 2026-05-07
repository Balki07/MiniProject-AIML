import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Phone, Briefcase, MapPin, FileText, CheckCircle, AlertCircle, Mail, PhoneCall, MapPinned } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const isNewGoogleUser = searchParams.get('google') === 'new';
  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const calculateCompletion = () => {
    const fields = ['name', 'phone', 'company', 'address', 'bio'];
    const filled = fields.filter(f => form[f] && form[f].trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = calculateCompletion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      toast.success(t('profile.toast.updated'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.toast.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">{t('profile.pageTitle')}</h1>
            <p className="text-white/50">{t('profile.pageSubtitle')}</p>
          </div>

          {/* Google Welcome Banner */}
          {isNewGoogleUser && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-2xl p-5 border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 48 48" width="22" height="22">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-blue-300 font-bold text-base mb-1">Welcome, {user.name}! 🎉 You signed in with Google.</p>
                  <p className="text-white/60 text-sm mb-3">Your name and email (<span className="text-white/80 font-medium">{user.email}</span>) are already filled in from your Google account. Please complete the remaining fields below to start posting ads.</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Name from Google</span>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Email from Google</span>
                    <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠ Phone needed</span>
                    <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">⚠ Company needed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="support-card rounded-3xl p-5 mb-8">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45 mb-2">{t('support.label')}</p>
              <h2 className="text-2xl font-black text-white mb-1">{t('support.title')}</h2>
              <p className="text-white/65 text-sm">{t('support.subtitleProfile')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a href="mailto:jbads@mail.com" className="support-chip hover-lift-3d rounded-2xl px-4 py-4 text-left">
                <Mail className="text-cyan-300 mb-3" size={18} />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40 mb-1">{t('support.emailLabel')}</div>
                <div className="text-white font-semibold break-all">jbads@mail.com</div>
              </a>
              <a href="tel:9685743210" className="support-chip hover-lift-3d rounded-2xl px-4 py-4 text-left">
                <PhoneCall className="text-emerald-300 mb-3" size={18} />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40 mb-1">{t('support.phoneLabel')}</div>
                <div className="text-white font-semibold">9685743210</div>
              </a>
              <div className="support-chip hover-lift-3d rounded-2xl px-4 py-4 text-left">
                <MapPinned className="text-amber-300 mb-3" size={18} />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40 mb-1">{t('support.addressLabel')}</div>
                <div className="text-white font-semibold">{t('support.addressValue')}</div>
              </div>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white flex items-center gap-2">
                {completion === 100 ? <CheckCircle className="text-emerald-400" size={18} /> : <AlertCircle className="text-amber-400" size={18} />}
                {t('profile.completionTitle')}
              </span>
              <span className={`font-black ${completion === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{completion}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 border border-white/10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${completion === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}
                style={{ width: `${completion}%` }} 
              />
            </div>
            {completion < 100 && (
              <p className="text-amber-400/80 text-xs mt-3 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                {t('profile.completionWarning')}
              </p>
            )}
          </div>

          {/* Form */}
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
                    <User size={14} className="text-brand-400"/> {t('profile.fullName')} <span className="text-red-400">*</span>
                  </label>
                  <input type="text" className="input-field" placeholder={t('profile.fullNamePlaceholder')} value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
                    <Phone size={14} className="text-brand-400"/> {t('profile.phone')} <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" className="input-field" placeholder={t('profile.phonePlaceholder')} value={form.phone} onChange={set('phone')} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
                  <Briefcase size={14} className="text-brand-400"/> {t('profile.company')} <span className="text-red-400">*</span>
                </label>
                <input type="text" className="input-field" placeholder={t('profile.companyPlaceholder')} value={form.company} onChange={set('company')} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
                  <MapPin size={14} className="text-brand-400"/> {t('profile.address')} <span className="text-red-400">*</span>
                </label>
                <input type="text" className="input-field" placeholder={t('profile.addressPlaceholder')} value={form.address} onChange={set('address')} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
                  <FileText size={14} className="text-brand-400"/> {t('profile.bio')} <span className="text-red-400">*</span>
                </label>
                <textarea className="input-field min-h-[100px] resize-none" placeholder={t('profile.bioPlaceholder')} value={form.bio} onChange={set('bio')} required />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-base shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                {loading ? t('profile.saving') : t('profile.saveDetails')}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
