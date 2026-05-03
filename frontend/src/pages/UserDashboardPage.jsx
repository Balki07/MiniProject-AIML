// src/pages/UserDashboardPage.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import TrustBadge from '../components/TrustBadge';
import { PlusCircle, Eye, MousePointer, CheckCircle, Clock, XCircle, Flag, PencilLine, Mail, PhoneCall, MapPinned, Upload, X, ShieldCheck, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Food', 'Tech', 'Jobs', 'Services', 'Business', 'Events', 'Real Estate', 'Other'];

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ open: false, adId: null });
  const [editLoading, setEditLoading] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', location: '' });

  const statusConfig = {
    approved: { label: t('status.approved'), icon: CheckCircle, cls: 'status-approved' },
    pending: { label: t('status.pendingReview'), icon: Clock, cls: 'status-pending' },
    rejected: { label: t('status.rejected'), icon: XCircle, cls: 'status-rejected' },
    flagged: { label: t('status.flagged'), icon: Flag, cls: 'status-flagged' },
  };

  useEffect(() => {
    api.get('/ads/user/my').then(({ data }) => setAds(data.ads)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const approved = ads.filter((a) => a.status === 'approved').length;
  const pending  = ads.filter((a) => a.status === 'pending').length;
  const trustScore = user?.trust_level || 0;

  const statusMeta = {
    approved: { label: t('status.approved'), icon: CheckCircle, accent: 'from-emerald-500/40 to-cyan-400/20', pill: 'status-approved' },
    pending: { label: t('status.pendingReview'), icon: Clock, accent: 'from-amber-500/40 to-yellow-300/20', pill: 'status-pending' },
    rejected: { label: t('status.rejected'), icon: XCircle, accent: 'from-red-500/40 to-fuchsia-400/20', pill: 'status-rejected' },
    flagged: { label: t('status.flagged'), icon: Flag, accent: 'from-violet-500/40 to-purple-400/20', pill: 'status-flagged' },
  };

  const trustFill = Math.max(0, Math.min(100, trustScore));
  const trustTone = trustFill >= 80 ? 'emerald' : trustFill >= 50 ? 'amber' : 'rose';
  const engagementPeak = Math.max(1, ...ads.map((ad) => Math.max(ad.impressions || 0, ad.clicks || 0)));

  const openEditModal = (ad) => {
    setEditForm({
      title: ad.title || '',
      description: ad.description || '',
      category: ad.category || '',
      location: ad.location || '',
    });
    setEditImage(null);
    setEditPreview(ad.image_url ? `http://localhost:5000${ad.image_url}` : null);
    setEditModal({ open: true, adId: ad.id });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, adId: null });
    setEditImage(null);
    setEditPreview(null);
    setEditLoading(false);
  };

  const handleEditImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImage(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const submitRejectedEdit = async () => {
    if (!editModal.adId) return;
    setEditLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', editForm.title);
      fd.append('description', editForm.description);
      fd.append('category', editForm.category);
      fd.append('location', editForm.location || '');
      if (editImage) fd.append('image', editImage);

      const { data } = await api.put(`/ads/${editModal.adId}`, fd);
      setAds((prev) => prev.map((ad) => ad.id === editModal.adId ? data.ad : ad));
      toast.success(t('user.rejectedEdit.success'));
      closeEditModal();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || t('user.rejectedEdit.failed'));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-[0.26em] text-white/50 mb-4">
                <Sparkles size={12} className="text-cyan-300" /> {t('user.stats.totalAds')}
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{t('user.welcome', { name: user?.name || 'User' })} 👋</h1>
              <p className="text-white/55 mt-2 text-sm md:text-base leading-7 max-w-2xl">{t('user.subtitle')}</p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('user.stats.totalAds'), value: ads.length, icon: Flag, tone: 'from-cyan-500/25 to-blue-500/10', valueClass: 'text-cyan-200' },
                  { label: t('user.stats.approved'), value: approved, icon: CheckCircle, tone: 'from-emerald-500/25 to-emerald-500/10', valueClass: 'text-emerald-300' },
                  { label: t('user.stats.pending'), value: pending, icon: Clock, tone: 'from-amber-500/25 to-amber-500/10', valueClass: 'text-amber-300' },
                  { label: t('user.stats.trustLevel'), value: `${trustScore}`, icon: ShieldCheck, tone: 'from-violet-500/25 to-fuchsia-500/10', valueClass: 'text-white', trust: true },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.tone} p-4 shadow-[0_16px_34px_-24px_rgba(0,0,0,0.8)]`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">{stat.label}</p>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white/80">
                          <Icon size={16} />
                        </div>
                      </div>
                      {stat.trust ? (
                        <div className="space-y-3">
                          <div className="flex items-end justify-between gap-3">
                            <p className={`text-3xl font-black leading-none ${stat.valueClass}`}>{stat.value}</p>
                            <TrustBadge score={trustScore} showScore={false} />
                          </div>
                          <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${trustFill >= 80 ? 'from-emerald-400 to-cyan-300' : trustFill >= 50 ? 'from-amber-400 to-yellow-300' : 'from-rose-400 to-orange-300'}`} style={{ width: `${trustFill}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className={`text-3xl font-black leading-none ${stat.valueClass}`}>{stat.value}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Link to="/post-ad" className="btn-primary inline-flex items-center justify-center gap-2 self-start min-w-[180px]">
              <PlusCircle size={16} /> {t('user.postNewAd')} <ArrowRight size={14} />
            </Link>
          </div>
        </motion.section>

        {user?.is_verified && (
          <motion.div whileHover={{ y: -2 }} className="mb-6 flex items-start gap-3 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-4 shadow-[0_18px_32px_-24px_rgba(16,185,129,0.6)]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/20 shrink-0">
              <CheckCircle size={16} className="text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-6">{t('user.verifiedBoost')}</p>
            </div>
          </motion.div>
        )}

        {(!user?.phone || !user?.company || !user?.address || !user?.bio) && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-4 shadow-[0_18px_32px_-24px_rgba(245,158,11,0.55)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/20 shrink-0">
                <AlertTriangle size={16} className="text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-6">{t('user.profileIncomplete')}</p>
              </div>
            </div>
            <Link to="/profile" className="flex-shrink-0 inline-flex items-center justify-center gap-2 text-amber-950 bg-amber-300 hover:bg-amber-200 font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/10">
              {t('user.completeProfile')}
            </Link>
          </div>
        )}

        <motion.div whileHover={{ y: -3 }} className="support-card rounded-3xl p-5 md:p-6 mb-8 overflow-hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45 mb-2">{t('support.label')}</p>
              <h2 className="text-2xl font-black text-white mb-1">{t('support.title')}</h2>
              <p className="text-white/65 text-sm max-w-2xl">{t('support.subtitleUser')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:max-w-[680px]">
              <a href="mailto:jbads@mail.com" className="support-chip hover-lift-3d rounded-2xl px-4 py-4 text-left transition-all hover:border-cyan-300/40">
                <Mail className="text-cyan-300 mb-3" size={18} />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40 mb-1">{t('support.emailLabel')}</div>
                <div className="text-white font-semibold break-all">jbads@mail.com</div>
              </a>
              <a href="tel:9685743210" className="support-chip hover-lift-3d rounded-2xl px-4 py-4 text-left transition-all hover:border-emerald-300/40">
                <PhoneCall className="text-emerald-300 mb-3" size={18} />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40 mb-1">{t('support.phoneLabel')}</div>
                <div className="text-white font-semibold">9685743210</div>
              </a>
              <div className="support-chip hover-lift-3d rounded-2xl px-4 py-4 text-left transition-all hover:border-amber-300/40">
                <MapPinned className="text-amber-300 mb-3" size={18} />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40 mb-1">{t('support.addressLabel')}</div>
                <div className="text-white font-semibold">{t('support.addressValue')}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-white">{t('user.yourAds')}</h2>
            <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {t('status.approved')}
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-3" /> {t('status.pendingReview')}
              <span className="w-2 h-2 rounded-full bg-red-400 ml-3" /> {t('status.rejected')}
              <span className="w-2 h-2 rounded-full bg-violet-400 ml-3" /> {t('status.flagged')}
            </div>
          </div>

          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="glass-card h-28 animate-pulse" />)
          ) : ads.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/45">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">📢</div>
              <p className="font-semibold text-white/80">{t('user.empty.title')}</p>
              <p className="text-sm mt-2 max-w-md mx-auto leading-6">{t('user.empty.subtitle')}</p>
              <Link to="/post-ad" className="inline-flex items-center gap-2 mt-5 btn-primary text-sm">
                <PlusCircle size={15} /> {t('user.empty.cta')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ads.map((ad) => {
                const cfg = statusMeta[ad.status] || statusMeta.pending;
                const Icon = cfg.icon;
                const trustWidth = Math.max(0, Math.min(100, ad.trust_score || 0));
                const engagementWidth = Math.min(100, Math.round(((Math.max(ad.impressions || 0, ad.clicks || 0)) / engagementPeak) * 100));

                return (
                  <motion.div key={ad.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 md:p-6 overflow-hidden">
                    <div className="relative flex flex-col md:flex-row gap-5">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full bg-gradient-to-b ${cfg.accent}`} />
                      {ad.image_url && (
                        <img src={`http://localhost:5000${ad.image_url}`} alt={ad.title} className="w-full md:w-32 h-40 md:h-28 object-cover rounded-2xl flex-shrink-0 border border-white/10 shadow-lg" />
                      )}
                      <div className="flex-1 min-w-0 md:pl-1">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-semibold text-white truncate text-lg">{ad.title}</span>
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.pill}`}>
                                <Icon size={11} /> {cfg.label}
                              </span>
                            </div>
                            <p className="text-white/50 text-sm leading-6 line-clamp-2">{ad.description}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-3 pl-0 md:pl-4 md:border-l md:border-white/10">
                            <TrustBadge score={ad.trust_score} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-white/45 text-xs">
                              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-1"><Eye size={11} /> {ad.impressions}</div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${Math.min(100, (ad.impressions || 0) / engagementPeak * 100)}%` }} />
                                </div>
                              </div>
                              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-1"><MousePointer size={11} /> {ad.clicks}</div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full rounded-full bg-violet-400/80" style={{ width: `${Math.min(100, (ad.clicks || 0) / engagementPeak * 100)}%` }} />
                                </div>
                              </div>
                              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-1"><ShieldCheck size={11} /> {ad.trust_score}</div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div className={`h-full rounded-full ${trustFill >= 80 ? 'bg-emerald-400/80' : trustFill >= 50 ? 'bg-amber-400/80' : 'bg-rose-400/80'}`} style={{ width: `${trustWidth}%` }} />
                                </div>
                              </div>
                              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-1"><Flag size={11} /> {ad.status}</div>
                                <div className={`h-1.5 rounded-full ${cfg.pill.includes('approved') ? 'bg-emerald-400/80' : cfg.pill.includes('pending') ? 'bg-amber-400/80' : cfg.pill.includes('rejected') ? 'bg-red-400/80' : 'bg-violet-400/80'}`} />
                              </div>
                            </div>

                            {ad.admin_message && (
                              <div className={`text-xs rounded-2xl px-4 py-3 border ${ad.status === 'approved' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}`}>
                                <div className="flex items-center gap-2 mb-2 text-white/65">
                                  <span className={`w-2 h-2 rounded-full ${ad.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                  <span className="font-semibold">{t('user.adminFeedback')}</span>
                                </div>
                                <p className="leading-6">{ad.admin_message}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start md:items-end justify-between md:justify-end gap-3 md:flex-col md:border-l md:border-white/10 md:pl-4">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-white/10 text-white/55 bg-white/5">
                                {new Date(ad.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {ad.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => openEditModal(ad)}
                                className="inline-flex items-center justify-center gap-2 mt-1 text-xs font-semibold px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 transition-all shadow-[0_12px_24px_-20px_rgba(245,158,11,0.7)]"
                              >
                                <PencilLine size={12} /> {t('user.rejectedEdit.button')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-gray-900 border border-white/15 rounded-2xl p-6"
            >
              <h3 className="text-xl font-black text-white mb-1">{t('user.rejectedEdit.title')}</h3>
              <p className="text-sm text-white/50 mb-5">{t('user.rejectedEdit.subtitle')}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">{t('post.form.title')}</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">{t('post.form.desc')}</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="input-field min-h-[120px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">{t('post.form.cat')}</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">{t('post.form.selectCategory')}</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{t(`category.${c.toLowerCase().replace(' ', '')}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">{t('post.form.loc')}</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">{t('post.form.image')}</label>
                  {editPreview ? (
                    <div className="relative">
                      <img src={editPreview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => { setEditImage(null); setEditPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 h-24 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors text-white/50 text-sm">
                      <Upload size={16} /> {t('user.rejectedEdit.uploadNewImage')}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleEditImage} />
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={closeEditModal} className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button
                  type="button"
                  onClick={submitRejectedEdit}
                  disabled={editLoading}
                  className="btn-primary flex-1"
                >
                  {editLoading ? t('user.rejectedEdit.resubmitting') : t('user.rejectedEdit.resubmit')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
