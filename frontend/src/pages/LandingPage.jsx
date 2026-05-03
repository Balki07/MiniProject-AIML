// src/pages/LandingPage.jsx
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Shield, Zap, TrendingUp, Eye, CheckCircle, Star, Mail, PhoneCall, MapPinned } from 'lucide-react';

const Feature = ({ icon: Icon, title, desc }) => (
  <motion.div whileHover={{ y: -8, rotateX: 5, rotateY: -4 }} className="glass-card hover-lift-3d p-6">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(145deg, rgba(19,196,255,0.34), rgba(32,246,178,0.22), rgba(255,95,122,0.2))' }}>
      <Icon size={22} style={{ color: 'var(--accent-cyan)' }} />
    </div>
    <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
    <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-4xl font-black text-white mb-1" style={{ textShadow: '0 12px 28px rgba(19,196,255,0.42)' }}>{value}</div>
    <div className="text-white/70 text-sm">{label}</div>
  </div>
);

const LandingPage = () => {
  const { t } = useLanguage();
  return (
  <div className="min-h-screen overflow-hidden">
    {/* Hero */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="hero-aura" />

      <motion.div
        className="absolute top-[18%] left-[8%] w-20 h-20 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 backdrop-blur-md hidden lg:block"
        animate={{ y: [0, -14, 0], rotate: [0, 8, 0], rotateX: [0, 10, 0] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[16%] right-[9%] w-16 h-16 rounded-full border border-emerald-300/30 bg-emerald-300/10 backdrop-blur-md hidden lg:block"
        animate={{ y: [0, 16, 0], x: [0, -8, 0], rotate: [0, -12, 0] }}
        transition={{ duration: 7.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 text-xs font-bold bg-cyan-300/15 text-white border border-cyan-300/30 px-4 py-1.5 rounded-full mb-6 shadow-[0_0_24px_rgba(19,196,255,0.2)]">
            <Shield size={12} /> {t('landing.hero.badge')}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
          style={{ textShadow: '0 22px 46px rgba(0,0,0,0.35)' }}
        >
          {t('landing.hero.title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/dashboard" className="btn-primary text-base px-8 py-3">
            {t('landing.hero.cta.browse')} →
          </Link>
          <Link to="/dashboard" className="btn-secondary text-base px-8 py-3">
            {t('landing.departments.title')}
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 glass-card hover-lift-3d p-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <Stat value="98%" label={t('landing.stats.fraudDetection')} />
          <Stat value="<2min" label={t('landing.stats.approvalTime')} />
          <Stat value="100%" label={t('landing.stats.verifiedListings')} />
        </motion.div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-white mb-4">{t('landing.how.title')}</h2>
        <p className="text-white/75 max-w-xl mx-auto">{t('landing.how.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { step: '01', title: t('landing.how.step1.title'), desc: t('landing.how.step1.desc') },
          { step: '02', title: t('landing.how.step2.title'), desc: t('landing.how.step2.desc') },
          { step: '03', title: t('landing.how.step3.title'), desc: t('landing.how.step3.desc') },
          { step: '04', title: t('landing.how.step4.title'), desc: t('landing.how.step4.desc') },
        ].map((item) => (
          <motion.div key={item.step} whileHover={{ y: -8, rotateX: 4 }} className="glass-card hover-lift-3d p-6 text-center">
            <div className="text-4xl font-black mb-3" style={{ color: 'rgba(246,183,60,0.38)' }}>{item.step}</div>
            <h3 className="font-bold text-white mb-2">{item.title}</h3>
            <p className="text-white/70 text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className="py-24 px-6" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">{t('landing.why.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature icon={Shield} title={t('landing.why.feature1.title')} desc={t('landing.why.feature1.desc')} />
          <Feature icon={Zap} title={t('landing.why.feature2.title')} desc={t('landing.why.feature2.desc')} />
          <Feature icon={TrendingUp} title={t('landing.why.feature3.title')} desc={t('landing.why.feature3.desc')} />
          <Feature icon={Eye} title={t('landing.why.feature4.title')} desc={t('landing.why.feature4.desc')} />
          <Feature icon={CheckCircle} title={t('landing.why.feature5.title')} desc={t('landing.why.feature5.desc')} />
          <Feature icon={Star} title={t('landing.why.feature6.title')} desc={t('landing.why.feature6.desc')} />
        </div>
      </div>
    </section>

    {/* Unified dashboard */}
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">{t('landing.departments.title')}</h2>
          <p className="text-white/50">{t('landing.departments.subtitle')}</p>
        </div>

        <Link to="/dashboard" className="glass-card hover-lift-3d p-6 flex items-center justify-between gap-4 transition-all duration-200 group">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">{t('landing.departments.cardLabel')}</p>
            <p className="text-white font-bold text-lg">{t('landing.departments.boardTitle')}</p>
          </div>
          <span style={{ color: 'var(--accent-mint)' }}>→</span>
        </Link>
      </div>
    </section>

    {/* CTA */}
    <section className="py-24 px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-card hover-lift-3d max-w-2xl mx-auto p-12">
        <h2 className="text-4xl font-black text-white mb-4">{t('landing.cta.title')}</h2>
        <p className="text-white/75 mb-8">{t('landing.cta.subtitle')}</p>
        <Link to="/register" className="btn-primary text-base px-10 py-3">{t('landing.cta.button')} →</Link>
      </motion.div>
    </section>

    {/* Support */}
    <section className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="support-card rounded-3xl p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45 mb-2">{t('support.label')}</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{t('support.title')}</h2>
              <p className="text-white/65 max-w-2xl">{t('support.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0 lg:min-w-[620px]">
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
        </motion.div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-white/5 py-8 text-center text-white/30 text-sm">
      © {new Date().getFullYear()} {t('landing.footer')}
    </footer>
  </div>
  );
};

export default LandingPage;
