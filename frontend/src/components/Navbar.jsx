// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Shield, Zap, User, Globe } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 md:px-4 pt-3">
      <div className="hero-aura" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card hover-lift-3d rounded-2xl px-3 md:px-4 flex items-center justify-between h-16 border-white/25 bg-white/10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover-lift-3d">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#07131f]" style={{ background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-cyan), var(--accent-mint))', boxShadow: '0 0 24px rgba(64,230,255,0.28)' }}>
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              JBAdX
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Language Switcher */}
            <div className="relative flex items-center mr-1">
              <Globe size={16} className="text-white/50 absolute left-2 pointer-events-none hidden md:block" />
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/10 border border-white/20 text-white/90 text-xs md:text-sm rounded-lg pl-2 md:pl-8 pr-6 py-1.5 focus:outline-none appearance-none cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="en" className="bg-gray-900 text-white">EN</option>
                <option value="ta" className="bg-gray-900 text-white">TA</option>
                <option value="fr" className="bg-gray-900 text-white">FR</option>
              </select>
            </div>

            <Link to="/dashboard" className="text-white/75 hover:text-white text-sm font-semibold px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
              {t('nav.dashboard')}
            </Link>

            {user && (
              <Link to="/post-ad" className="text-brand-200 hover:text-white text-sm font-semibold px-2 md:px-3 py-2 rounded-lg bg-brand-500/15 hover:bg-brand-500/25 transition-all border border-brand-400/20">
                {t('nav.post')}
              </Link>
            )}

            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
                  <User size={15} /> <span className="hidden md:inline">{t('nav.profile')}</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-[#ffd27a] hover:text-[#ffdd98] text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-[#f6b73c]/20 transition-all">
                    <Shield size={15} /> <span className="hidden md:inline">{t('nav.admin')}</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/60 hover:text-white/90 text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-all">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm py-2">{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
