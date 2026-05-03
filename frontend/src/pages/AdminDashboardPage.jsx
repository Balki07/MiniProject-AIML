// src/pages/AdminDashboardPage.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import TrustBadge from '../components/TrustBadge';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle, XCircle, Users, FileText, AlertTriangle, Zap, Eye, ShieldCheck } from 'lucide-react';

const TABS = ['pending', 'approved', 'rejected', 'flagged'];

const AdminDashboardPage = () => {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState('pending');
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [moderationModal, setModerationModal] = useState({ open: false, adId: null, action: 'approved', message: '' });
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [verificationModal, setVerificationModal] = useState({
    open: false,
    adId: null,
    score: 0,
    flags: [],
    recommendation: 'publish',
    action: 'publish',
    message: '',
    signature: '',
  });

  const [approvalReportModal, setApprovalReportModal] = useState({ open: false, report: null });

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setAnalytics(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/ads?status=${tab}`)
      .then(({ data }) => setAds(data.ads))
      .catch(() => toast.error(t('admin.toast.loadError')))
      .finally(() => setLoading(false));
  }, [tab]);

  const moderate = async (id, status, adminMessage = '') => {
    setActionLoading(id);
    try {
      await api.put(`/admin/ads/${id}/status`, { status, admin_message: adminMessage });
      toast.success(t('admin.toast.actionSuccess', { status: t(`status.${status}`) }));
      setAds((prev) => prev.filter((a) => a.id !== id));
      // Refresh analytics
      const { data } = await api.get('/admin/analytics');
      setAnalytics(data);
    } catch {
      toast.error(t('admin.toast.actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerateClick = (id, action) => {
    setModerationModal({ open: true, adId: id, action, message: '' });
  };

  const startVerification = async (id) => {
    setActionLoading(id);
    try {
      const { data } = await api.get(`/admin/ads/${id}/verification-preview`);
      setVerificationModal({
        open: true,
        adId: id,
        score: data.trust_score,
        flags: data.flags || [],
        recommendation: data.recommendation || 'publish',
        action: data.recommendation || 'publish',
        message: '',
        signature: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || t('admin.verification.failed'));
    } finally {
      setActionLoading(null);
    }
  };

  const submitVerificationDecision = () => {
    if (!verificationModal.message.trim()) {
      toast.error(t('admin.toast.messageRequired'));
      return;
    }
    if (!verificationModal.signature.trim()) {
      toast.error(t('admin.verification.signatureRequired'));
      return;
    }

    const finalStatus = verificationModal.action === 'publish' ? 'approved' : 'removed';
    moderate(verificationModal.adId, finalStatus, `${verificationModal.message} | Signed by: ${verificationModal.signature}`);
    setVerificationModal({
      open: false,
      adId: null,
      score: 0,
      flags: [],
      recommendation: 'publish',
      action: 'publish',
      message: '',
      signature: '',
    });
  };

  const submitModeration = () => {
    if (!moderationModal.message.trim()) {
      toast.error(t('admin.toast.messageRequired'));
      return;
    }
    moderate(moderationModal.adId, moderationModal.action, moderationModal.message);
    setModerationModal({ open: false, adId: null, action: 'approved', message: '' });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-amber-400" />
              </div>
              {t('admin.title')}
            </h1>
            <div className="flex gap-2 flex-wrap">
              <Link to="/admin/layout" className="btn-secondary text-sm">
                {t('admin.openLayoutBuilder')}
              </Link>
              <Link to="/admin/history" className="btn-secondary text-sm">
                {t('admin.viewHistory') || 'View History'}
              </Link>
              <button
                onClick={async () => {
                  if (!window.confirm('Regenerate all missing reports? This may take a moment.')) return;
                  setRegeneratingAll(true);
                  try {
                    await api.post('/admin/regenerate-all-reports');
                    toast.success('Report regeneration started in background');
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to start regeneration');
                  } finally {
                    setRegeneratingAll(false);
                  }
                }}
                disabled={regeneratingAll}
                className="btn-secondary text-sm"
              >
                {regeneratingAll ? 'Regenerating...' : 'Regenerate All Reports'}
              </button>
            </div>
          </div>
          <p className="text-white/50 mt-1">{t('admin.subtitle')}</p>
        </div>

        {/* Analytics cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: t('admin.stats.totalUsers'), value: analytics.users.total, icon: Users, color: 'text-brand-400' },
              { label: t('admin.stats.pending'), value: analytics.ads.pending, icon: FileText, color: 'text-amber-400' },
              { label: t('admin.stats.approved'), value: analytics.ads.approved, icon: CheckCircle, color: 'text-emerald-400' },
              { label: t('admin.stats.rejected'), value: analytics.ads.rejected, icon: XCircle, color: 'text-red-400' },
              { label: t('admin.stats.fraudRate'), value: `${analytics.fraud_rate}%`, icon: AlertTriangle, color: 'text-orange-400' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} whileHover={{ y: -3 }} className="glass-card p-5">
                  <Icon size={18} className={`${stat.color} mb-2`} />
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize border transition-all duration-200 ${
                tab === tabKey ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {t(`status.${tabKey}`)}
              {analytics && tabKey === 'pending' && analytics.ads.pending > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{analytics.ads.pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* Ads list */}
        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28 animate-pulse" />)}</div>
        ) : ads.length === 0 ? (
          <div className="glass-card p-16 text-center text-white/40">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">{t('admin.empty', { status: t(`status.${tab}`) })}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <motion.div key={ad.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
                <div className="flex items-start gap-4">
                  {ad.image_url && (
                    <img src={`http://localhost:5000${ad.image_url}`} alt="" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{ad.title}</h3>
                      <TrustBadge score={ad.trust_score} />
                      {ad.auto_processed && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">{t('admin.autoProcessed')}</span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm line-clamp-2 mb-2">{ad.description}</p>
                    <div className="flex flex-wrap gap-3 text-white/40 text-xs">
                      <span>📂 {ad.category}</span>
                      <span>📍 {ad.location || t('common.na')}</span>
                      <span>👤 {ad.vendor_name}</span>
                      <span>📧 {ad.vendor_email}</span>
                      <span>⏰ {new Date(ad.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                      <span className="flex items-center gap-1"><Eye size={11} /> {ad.impressions}</span>
                    </div>
                  </div>

                  {tab === 'pending' ? (
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => handleModerateClick(ad.id, 'approved')}
                        disabled={actionLoading === ad.id}
                        className="flex items-center gap-1.5 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> {t('admin.actions.approve')}
                      </button>
                      <button
                        onClick={() => handleModerateClick(ad.id, 'rejected')}
                        disabled={actionLoading === ad.id}
                        className="btn-danger flex items-center gap-1.5 text-sm"
                      >
                        <XCircle size={14} /> {t('admin.actions.reject')}
                      </button>
                    </div>
                  ) : tab === 'flagged' ? (
                    <button
                      onClick={() => startVerification(ad.id)}
                      disabled={actionLoading === ad.id}
                      className="flex items-center gap-1.5 text-sm bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                      <ShieldCheck size={14} /> {t('admin.verification.start')}
                    </button>
                  ) : tab === 'approved' ? (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => moderate(ad.id, 'removed')} disabled={actionLoading === ad.id} className="btn-danger text-sm flex-shrink-0">{t('admin.actions.remove')}</button>
                      <button
                        onClick={async () => {
                          setActionLoading(ad.id);
                          try {
                            const { data } = await api.get(`/admin/ads/${ad.id}/report`);
                            setApprovalReportModal({ open: true, report: data.report });
                          } catch (err) {
                            toast.error(err.response?.data?.error || 'Failed to load report');
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        className="text-sm bg-white/5 border border-white/10 px-3 py-2 rounded-xl"
                      >
                        {t('admin.viewReport') || 'View Report'}
                      </button>
                      <button
                        onClick={async () => {
                          setActionLoading(ad.id);
                          try {
                            await api.post(`/admin/ads/${ad.id}/regenerate-report`);
                            toast.success('Report regenerated');
                            setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a } : a));
                          } catch (err) {
                            toast.error(err.response?.data?.error || 'Failed to regenerate');
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        disabled={actionLoading === ad.id}
                        className="text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        {t('admin.regenerateReport') || 'Regenerate PDF'}
                      </button>
                    </div>
                  ) : null}
                </div>
                {ad.admin_message && (
                  <div className={`mt-3 text-xs border rounded-lg px-3 py-2 ${
                    ad.status === 'approved' 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                      : 'text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                    {t('admin.note')}: {ad.admin_message}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
        {/* Moderation Feedback Modal */}
        {approvalReportModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-900 border-2 rounded-2xl p-6 w-full max-w-3xl shadow-[0_0_40px_-10px]">
              <h3 className="text-xl font-black text-white mb-2">{t('admin.report.title') || 'Approval Report'}</h3>
              <p className="text-white/60 text-sm mb-4">{t('admin.report.subtitle') || 'Snapshot and analytics for this approved advertisement.'}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="glass-card p-4">
                  <h4 className="text-sm text-white/60 mb-2">{t('admin.report.adSnapshot')}</h4>
                  <pre className="text-xs text-white/70 max-h-56 overflow-auto">{JSON.stringify(approvalReportModal.report.ad_snapshot, null, 2)}</pre>
                </div>

                <div className="glass-card p-4">
                  <h4 className="text-sm text-white/60 mb-2">{t('admin.report.verification')}</h4>
                  <pre className="text-xs text-white/70 max-h-56 overflow-auto">{JSON.stringify(approvalReportModal.report.verification, null, 2)}</pre>
                </div>
              </div>

              <div className="glass-card p-4 mb-4">
                <h4 className="text-sm text-white/60 mb-2">{t('admin.report.engagement')}</h4>
                <div className="flex items-center gap-4">
                  <div className="text-white/80">
                    <div className="text-2xl font-black">{approvalReportModal.report.analytics?.totals?.impressions || 0}</div>
                    <div className="text-sm text-white/50">{t('admin.report.impressions')}</div>
                  </div>
                  <div className="text-white/80">
                    <div className="text-2xl font-black">{approvalReportModal.report.analytics?.totals?.clicks || 0}</div>
                    <div className="text-sm text-white/50">{t('admin.report.clicks')}</div>
                  </div>
                  <div className="text-white/80">
                    <div className="text-2xl font-black">{approvalReportModal.report.analytics?.totals?.ctr || 0}%</div>
                    <div className="text-sm text-white/50">{t('admin.report.ctr')}</div>
                  </div>
                </div>

                <div className="mt-4">
                  {/* Simple sparkline using SVG */}
                  <svg viewBox="0 0 300 60" className="w-full h-16">
                    {approvalReportModal.report.analytics?.series?.length > 0 && (() => {
                      const s = approvalReportModal.report.analytics.series;
                      const max = Math.max(1, ...s.map(d => Math.max(d.impressions, d.clicks)));
                      const points = s.map((d, i) => `${(i/(s.length-1))*300},${60 - (d.impressions/max)*50}`).join(' ');
                      return <polyline fill="none" stroke="#7c3aed" strokeWidth={2} points={points} />;
                    })()}
                  </svg>
                </div>

              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setApprovalReportModal({ open: false, report: null })} className="px-4 py-2 rounded-xl text-white/50 hover:bg-white/10">{t('common.close')}</button>
                <a href="#" onClick={(e) => { e.preventDefault(); /* share/download placeholder */ }} className="px-4 py-2 rounded-xl bg-brand-400 text-black font-bold">{t('admin.report.share') || 'Share / Download'}</a>
              </div>
            </motion.div>
          </div>
        )}
        {moderationModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className={`bg-gray-900 border-2 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_-10px] ${
                moderationModal.action === 'approved' 
                  ? 'border-emerald-500/50 shadow-emerald-500/20' 
                  : 'border-red-500/50 shadow-red-500/20'
              }`}
            >
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2 capitalize">
                {moderationModal.action === 'approved' ? (
                  <CheckCircle className="text-emerald-400" size={24} />
                ) : (
                  <XCircle className="text-red-400" size={24} />
                )}
                {t('admin.modal.title', { action: t(`status.${moderationModal.action}`) })}
              </h3>
              <p className="text-white/60 text-sm mb-5">
                {moderationModal.action === 'approved' 
                  ? t('admin.modal.approveHint')
                  : t('admin.modal.rejectHint')}
              </p>
              
              <textarea
                className={`w-full min-h-[120px] mb-5 text-sm resize-none p-4 rounded-xl bg-black/50 text-white font-medium outline-none border-2 transition-all duration-300 focus:shadow-[0_0_15px] ${
                  moderationModal.action === 'approved'
                    ? 'border-emerald-500/30 focus:border-emerald-500 focus:shadow-emerald-500/20 placeholder:text-emerald-500/30'
                    : 'border-red-500/30 focus:border-red-500 focus:shadow-red-500/20 placeholder:text-red-500/30'
                }`}
                placeholder={moderationModal.action === 'approved' ? t('admin.modal.approvePlaceholder') : t('admin.modal.rejectPlaceholder')}
                value={moderationModal.message}
                onChange={(e) => setModerationModal({ ...moderationModal, message: e.target.value })}
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setModerationModal({ open: false, adId: null, action: 'approved', message: '' })} 
                  className="flex-1 px-4 py-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white font-bold transition-all text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={submitModeration} 
                  className={`flex-1 font-bold py-2.5 rounded-xl transition-all text-sm text-black ${
                    moderationModal.action === 'approved'
                      ? 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  }`}
                >
                  {t('admin.modal.confirm', { action: t(`status.${moderationModal.action}`) })}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {verificationModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border-2 border-brand-500/40 rounded-2xl p-6 w-full max-w-xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.35)]"
            >
              <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="text-brand-300" size={22} /> {t('admin.verification.title')}
              </h3>
              <p className="text-white/60 text-sm mb-5">{t('admin.verification.subtitle')}</p>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">{t('admin.verification.score')}</span>
                  <span className="text-white text-2xl font-black">{verificationModal.score}<span className="text-sm text-white/60">/100</span></span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full bg-brand-400" style={{ width: `${Math.max(0, Math.min(100, verificationModal.score))}%` }} />
                </div>
                <p className="text-xs text-white/60">
                  {t('admin.verification.recommendation')}: <span className="font-bold text-white">{t(`admin.verification.${verificationModal.recommendation}`)}</span>
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-white/70 mb-2">{t('admin.verification.flags')}</p>
                <ul className="text-xs text-white/60 space-y-1 max-h-28 overflow-auto pr-2">
                  {verificationModal.flags.length > 0 ? verificationModal.flags.map((flag, idx) => (
                    <li key={idx}>• {flag}</li>
                  )) : (
                    <li>• {t('admin.verification.noFlags')}</li>
                  )}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setVerificationModal((prev) => ({ ...prev, action: 'publish' }))}
                  className={`rounded-xl px-4 py-2 text-sm font-bold border ${verificationModal.action === 'publish' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-white/60 border-white/10'}`}
                >
                  {t('admin.verification.publish')}
                </button>
                <button
                  onClick={() => setVerificationModal((prev) => ({ ...prev, action: 'remove' }))}
                  className={`rounded-xl px-4 py-2 text-sm font-bold border ${verificationModal.action === 'remove' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-white/5 text-white/60 border-white/10'}`}
                >
                  {t('admin.verification.remove')}
                </button>
              </div>

              <textarea
                className="w-full min-h-[100px] mb-3 text-sm resize-none p-4 rounded-xl bg-black/50 text-white font-medium outline-none border border-white/15 focus:border-brand-400/50"
                placeholder={t('admin.verification.messagePlaceholder')}
                value={verificationModal.message}
                onChange={(e) => setVerificationModal((prev) => ({ ...prev, message: e.target.value }))}
              />

              <input
                className="w-full mb-5 text-sm p-3 rounded-xl bg-black/50 text-white font-medium outline-none border border-white/15 focus:border-brand-400/50"
                placeholder={t('admin.verification.signaturePlaceholder')}
                value={verificationModal.signature}
                onChange={(e) => setVerificationModal((prev) => ({ ...prev, signature: e.target.value }))}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setVerificationModal({
                    open: false,
                    adId: null,
                    score: 0,
                    flags: [],
                    recommendation: 'publish',
                    action: 'publish',
                    message: '',
                    signature: '',
                  })}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white font-bold transition-all text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={submitVerificationDecision}
                  className="flex-1 font-bold py-2.5 rounded-xl transition-all text-sm text-black bg-brand-300 hover:bg-brand-200"
                >
                  {t('admin.verification.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
