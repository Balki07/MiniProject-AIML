// src/pages/UserDashboardPage.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import TrustBadge from '../components/TrustBadge';
import { PlusCircle, Eye, MousePointer, CheckCircle, Clock, XCircle, Flag } from 'lucide-react';

const STATUS_CONFIG = {
  approved: { label: 'Approved', icon: CheckCircle, cls: 'status-approved' },
  pending:  { label: 'Pending Review', icon: Clock,        cls: 'status-pending' },
  rejected: { label: 'Rejected',  icon: XCircle,    cls: 'status-rejected' },
  flagged:  { label: 'Flagged',   icon: Flag,       cls: 'status-flagged' },
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ads/user/my').then(({ data }) => setAds(data.ads)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const approved = ads.filter((a) => a.status === 'approved').length;
  const pending  = ads.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Welcome, {user?.name} 👋</h1>
            <p className="text-white/50 mt-1">Manage your advertisements and track performance.</p>
          </div>
          <Link to="/post-ad" className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} /> Post New Ad
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Ads', value: ads.length, icon: Flag },
            { label: 'Approved', value: approved, icon: CheckCircle },
            { label: 'Pending', value: pending, icon: Clock },
            { label: 'My Trust Level', value: `${user?.trust_level || 0}`, icon: null, badge: true },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -3 }} className="glass-card p-5">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
              {stat.badge
                ? <TrustBadge score={user?.trust_level || 0} showScore={false} />
                : <p className="text-3xl font-black text-white">{stat.value}</p>
              }
            </motion.div>
          ))}
        </div>

        {/* User badge */}
        {user?.is_verified && (
          <div className="mb-6 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> Your account is verified — you receive a +30 trust boost on every ad.
          </div>
        )}

        {/* Ads list */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Your Ads</h2>

          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="glass-card h-24 animate-pulse" />)
          ) : ads.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/40">
              <div className="text-4xl mb-3">📢</div>
              <p className="font-semibold">No ads yet</p>
              <p className="text-sm mt-2">Post your first ad to get started.</p>
              <Link to="/post-ad" className="inline-block mt-4 btn-primary text-sm">Post Ad</Link>
            </div>
          ) : (
            ads.map((ad) => {
              const cfg = STATUS_CONFIG[ad.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <motion.div key={ad.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 flex items-center gap-5">
                  {ad.image_url && (
                    <img src={`http://localhost:5000${ad.image_url}`} alt={ad.title} className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white truncate">{ad.title}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.cls}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs line-clamp-1">{ad.description}</p>
                    {ad.rejection_reason && (
                      <p className="text-red-400 text-xs mt-1">Reason: {ad.rejection_reason}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1">
                    <TrustBadge score={ad.trust_score} />
                    <div className="flex items-center gap-3 text-white/30 text-xs justify-end mt-1">
                      <span className="flex items-center gap-1"><Eye size={11} /> {ad.impressions}</span>
                      <span className="flex items-center gap-1"><MousePointer size={11} /> {ad.clicks}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
