import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import TrustBadge from '../components/TrustBadge';
import { useLanguage } from '../context/LanguageContext';
import { Download, Calendar, MapPin, Inbox, FileText } from 'lucide-react';

const STATUSES = ['approved', 'rejected', 'flagged', 'removed'];

const AdminAdHistoryPage = () => {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState('approved');
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [status, page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/ads/history', {
        params: { status, page, limit: 50 },
      });
      setAds(data.ads);
    } catch (err) {
      toast.error(err.response?.data?.error || t('admin.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (ad) => {
    if (!ad.report?.pdf_path) {
      toast.error(t('admin.report.notAvailable') || 'PDF report not available');
      return;
    }

    setDownloadingId(ad.id);
    try {
      const response = await fetch(`http://localhost:5000${ad.report.pdf_path}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `approval-${ad.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('admin.report.downloaded') || 'Report downloaded');
    } catch (err) {
      toast.error(t('admin.report.downloadFailed') || 'Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <FileText size={28} className="text-brand-300" />
              {t('admin.history.title') || 'Advertisement History'}
            </h1>
            <Link to="/admin" className="btn-secondary text-sm">
              {t('admin.history.backToModeration') || 'Back to Moderation'}
            </Link>
          </div>
          <p className="text-white/50 mt-1">{t('admin.history.subtitle') || 'View and download PDF reports for all advertisements.'}</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => { setStatus(st); setPage(1); }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize border transition-all duration-200 ${
                status === st ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {t(`status.${st}`)}
            </button>
          ))}
        </div>

        {/* Ads List */}
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}</div>
        ) : ads.length === 0 ? (
          <div className="glass-card p-16 text-center text-white/40">
            <Inbox size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">{t('admin.history.empty') || `No ${status} advertisements found.`}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <motion.div key={ad.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  {ad.image_url && (
                    <img
                      src={`http://localhost:5000${ad.image_url}`}
                      alt={ad.title}
                      className="w-full md:w-24 md:h-20 object-cover rounded-xl flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg">{ad.title}</h3>
                      <TrustBadge score={ad.trust_score} />
                    </div>

                    <p className="text-white/60 text-sm line-clamp-2 mb-2">{ad.description}</p>

                    <div className="flex flex-wrap gap-4 text-white/40 text-xs mb-2">
                      <span className="flex items-center gap-1">📂 {ad.category}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {ad.location || t('common.na')}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ad.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                      {ad.admin_message && <span className="text-amber-400">💬 {t('admin.note')}</span>}
                    </div>

                    {ad.admin_message && (
                      <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs">
                        <p className="font-semibold mb-1">{t('admin.moderatorNote')}:</p>
                        <p>{ad.admin_message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto">
                    {status === 'approved' && ad.report?.pdf_path ? (
                      <button
                        onClick={() => downloadReport(ad)}
                        disabled={downloadingId === ad.id}
                        className="flex items-center justify-center gap-1.5 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        <Download size={14} /> {downloadingId === ad.id ? t('admin.downloading') || 'Downloading...' : t('admin.downloadReport') || 'Download PDF'}
                      </button>
                    ) : status === 'approved' ? (
                      <div className="text-xs text-white/40 text-center px-4 py-2">{t('admin.report.generating') || 'Generating report...'}</div>
                    ) : (
                      <div className="text-xs text-white/40 text-center px-4 py-2">{t('admin.report.notAvailableForStatus') || 'Report N/A'}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && ads.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 disabled:opacity-50"
            >
              {t('common.prev') || 'Previous'}
            </button>
            <span className="text-white/60 text-sm">{t('common.page')} {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={ads.length < 50}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 disabled:opacity-50"
            >
              {t('common.next') || 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdHistoryPage;
