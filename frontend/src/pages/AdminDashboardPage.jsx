// src/pages/AdminDashboardPage.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import TrustBadge from '../components/TrustBadge';
import { CheckCircle, XCircle, Users, FileText, AlertTriangle, Zap, Eye } from 'lucide-react';

const TABS = ['pending', 'approved', 'rejected', 'flagged'];

const AdminDashboardPage = () => {
  const [tab, setTab] = useState('pending');
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setAnalytics(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/ads?status=${tab}`)
      .then(({ data }) => setAds(data.ads))
      .catch(() => toast.error('Failed to load ads.'))
      .finally(() => setLoading(false));
  }, [tab]);

  const moderate = async (id, status, rejectionReason = '') => {
    setActionLoading(id);
    try {
      await api.put(`/admin/ads/${id}/status`, { status, rejection_reason: rejectionReason });
      toast.success(`Ad ${status} successfully!`);
      setAds((prev) => prev.filter((a) => a.id !== id));
      // Refresh analytics
      const { data } = await api.get('/admin/analytics');
      setAnalytics(data);
    } catch {
      toast.error('Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id) => {
    const reason = window.prompt('Rejection reason (optional):') || 'Policy violation';
    moderate(id, 'rejected', reason);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-amber-400" />
            </div>
            Admin Dashboard
          </h1>
          <p className="text-white/50 mt-1">Review submissions, moderate ads, and monitor platform health.</p>
        </div>

        {/* Analytics cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Users', value: analytics.users.total, icon: Users, color: 'text-brand-400' },
              { label: 'Pending', value: analytics.ads.pending, icon: FileText, color: 'text-amber-400' },
              { label: 'Approved', value: analytics.ads.approved, icon: CheckCircle, color: 'text-emerald-400' },
              { label: 'Rejected', value: analytics.ads.rejected, icon: XCircle, color: 'text-red-400' },
              { label: 'Fraud Rate', value: `${analytics.fraud_rate}%`, icon: AlertTriangle, color: 'text-orange-400' },
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
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize border transition-all duration-200 ${
                tab === t ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {t}
              {analytics && t === 'pending' && analytics.ads.pending > 0 && (
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
            <p className="font-semibold">No {tab} ads</p>
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
                        <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">Auto-processed</span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm line-clamp-2 mb-2">{ad.description}</p>
                    <div className="flex flex-wrap gap-3 text-white/40 text-xs">
                      <span>📂 {ad.category}</span>
                      <span>📍 {ad.location || 'N/A'}</span>
                      <span>👤 {ad.vendor_name}</span>
                      <span>📧 {ad.vendor_email}</span>
                      <span>⏰ {new Date(ad.created_at).toLocaleString('en-IN')}</span>
                      <span className="flex items-center gap-1"><Eye size={11} /> {ad.impressions}</span>
                    </div>
                  </div>

                  {tab === 'pending' || tab === 'flagged' ? (
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => moderate(ad.id, 'approved')}
                        disabled={actionLoading === ad.id}
                        className="flex items-center gap-1.5 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(ad.id)}
                        disabled={actionLoading === ad.id}
                        className="btn-danger flex items-center gap-1.5 text-sm"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : tab === 'approved' ? (
                    <button onClick={() => moderate(ad.id, 'removed')} disabled={actionLoading === ad.id} className="btn-danger text-sm flex-shrink-0">Remove</button>
                  ) : null}
                </div>
                {ad.rejection_reason && (
                  <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    Reason: {ad.rejection_reason}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
