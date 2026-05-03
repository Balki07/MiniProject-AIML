import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import TrustBadge from '../components/TrustBadge';
import { MapPin, Clock, User, ShieldCheck, Mail, ArrowLeft, Flag, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AdDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data } = await api.get(`/ads/${id}`);
        setAd(data.ad);
      } catch (err) {
        toast.error(t('adDetails.toast.loadFailed'));
        navigate('/ads');
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id, navigate]);

  const handleActionClick = async () => {
    try {
      await api.post(`/ads/${id}/click`);
      toast.success(t('adDetails.toast.interestRegistered'));
    } catch {
      // ignore
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('adDetails.toast.loginRequired'));
      navigate('/login');
      return;
    }
    
    setReportLoading(true);
    try {
      await api.post('/reports', { ad_id: id, reason: reportReason });
      toast.success(t('adDetails.toast.reportSubmitted'));
      setShowReport(false);
    } catch (err) {
      toast.error(err.response?.data?.error || t('adDetails.toast.reportFailed'));
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-hero-gradient">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> {t('adDetails.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image & Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
              {ad.image_url ? (
                <div className="w-full h-96 sm:h-[500px] bg-black">
                  <img
                    src={ad.image_url.startsWith('http') ? ad.image_url : `http://localhost:5000${ad.image_url}`}
                    alt={ad.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-white/5 flex flex-col items-center justify-center text-white/20">
                  <span className="text-6xl mb-2">📄</span>
                  <p>{t('adDetails.noPoster')}</p>
                </div>
              )}
              
              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-cyan-400/15 text-cyan-300 px-3 py-1 rounded-lg text-sm font-semibold border border-cyan-300/20">
                    {ad.category}
                  </span>
                  <TrustBadge score={ad.trust_score} />
                  {ad.is_featured && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-sm font-semibold">
                      ⭐ {t('adDetails.featured')}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">
                  {ad.title}
                </h1>

                <div className="flex flex-wrap gap-6 text-white/50 text-sm mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-cyan-300" />
                    <span>{ad.location || t('adDetails.locationFallback')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-fuchsia-300" />
                    <span>{t('adDetails.postedOn', { date: new Date(ad.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-emerald-300" />
                    <span>{t('adDetails.views', { count: ad.impressions })}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-bold text-white mb-4">{t('adDetails.about')}</h3>
                  <p className="text-white/70 whitespace-pre-line leading-relaxed">
                    {ad.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Vendor Info & Actions */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User size={18} className="text-brand-400" /> {t('adDetails.vendorDetails')}
              </h3>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                <div className="font-bold text-lg text-white mb-1">{ad.vendor_name}</div>
                <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
                  <Mail size={14} /> {ad.vendor_email}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">{t('adDetails.vendorTrustLevel')}</span>
                    <span className="font-bold text-white">{ad.vendor_trust}/100</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, ad.vendor_trust))}%` }} />
                  </div>
                </div>

                {ad.vendor_verified && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 font-semibold">
                    <ShieldCheck size={16} /> {t('adDetails.identityVerified')}
                  </div>
                )}
              </div>

              <button onClick={handleActionClick} className="btn-primary w-full py-3.5 flex justify-center items-center gap-2 text-lg">
                <ExternalLink size={18} /> {t('adDetails.interested')}
              </button>
            </motion.div>

            {/* Reporting Box */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 border-red-500/10">
              <div className="flex items-start gap-3 text-sm text-white/50 mb-4">
                <ShieldCheck size={20} className="text-brand-500 shrink-0" />
                <p>{t('adDetails.reportingHint')}</p>
              </div>
              
              {!showReport ? (
                <button onClick={() => setShowReport(true)} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors flex justify-center items-center gap-2 font-semibold text-sm">
                  <Flag size={14} /> {t('adDetails.reportAd')}
                </button>
              ) : (
                <form onSubmit={handleReport} className="space-y-3 animate-fade-in">
                  <select 
                    className="input-field text-sm" 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)} 
                    required
                  >
                    <option value="">{t('adDetails.report.selectReason')}</option>
                    <option value="Scam">{t('adDetails.report.reasonScam')}</option>
                    <option value="Inappropriate">{t('adDetails.report.reasonInappropriate')}</option>
                    <option value="Misleading">{t('adDetails.report.reasonMisleading')}</option>
                    <option value="Other">{t('adDetails.report.reasonOther')}</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowReport(false)} className="flex-1 btn-secondary py-2 text-sm">{t('common.cancel')}</button>
                    <button type="submit" disabled={reportLoading} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-semibold transition-colors disabled:opacity-50">
                      {t('adDetails.report.submit')}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetailsPage;
