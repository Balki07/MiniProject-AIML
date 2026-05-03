// src/pages/TrustedFeedPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '../services/api';
import AdCard from '../components/AdCard';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Food', 'Tech', 'Jobs', 'Services', 'Business', 'Events', 'Real Estate', 'Other'];
const DEPARTMENT_BOARDS = ['food', 'tech', 'jobs', 'services', 'business', 'events'];

const TrustedFeedPage = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const pageSizeOptions = [12, 24, 36, 48];

  const fetchAds = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: pageSize };
      if (category !== 'All') params.category = category;
      if (location.trim()) params.location = location.trim();
      const { data } = await api.get('/ads', { params });
      setAds(data.ads || []);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || t('feed.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, [category, page, pageSize]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAds(1);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-white mb-3">
            {t('feed.title')}
          </motion.h1>
          <p className="text-white/50">{t('feed.subtitle')}</p>
        </div>

        <form onSubmit={handleSearch} className="glass-card p-4 mb-8 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              className="input-field pl-9 py-2.5"
              placeholder={t('feed.searchPlaceholder')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary py-2.5">{t('feed.search')}</button>
        </form>

        <div className="glass-card p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/45 mb-1">{t('feed.pageSize.label')}</p>
            <h3 className="text-lg font-black text-white">{t('feed.pageSize.title')}</h3>
            <p className="text-sm text-white/55">{t('feed.pageSize.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPage(1);
                  setPageSize(size);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  pageSize === size
                    ? 'bg-cyan-400/20 border-cyan-300/60 text-white shadow-[0_0_20px_rgba(64,230,255,0.18)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {size} {t('feed.pageSize.ads')}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">{t('feed.boards.title')}</p>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENT_BOARDS.map((slug) => (
              <Link
                key={slug}
                to={`/department/${slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-cyan-300/30 text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors"
              >
                {t(`category.${slug.replace('-', '')}`)} {t('feed.boards.suffix')}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                category === cat
                  ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 border-cyan-300 text-white shadow-[0_0_20px_rgba(64,230,255,0.2)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-cyan-300/30'
              }`}
            >
              {t(`category.${cat.toLowerCase().replace(' ', '')}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card h-64 animate-pulse break-inside-avoid" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-24 text-white/40">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold">{t('feed.empty.title')}</p>
            <p className="text-sm mt-2">{t('feed.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="break-inside-avoid">
                <AdCard ad={ad} />
              </div>
            ))}
          </div>
        )}

        {!loading && ads.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← {t('feed.prev')}</button>
            <span className="text-white/50 text-sm">{t('feed.page', { page })}</span>
            <button onClick={() => setPage(page + 1)} disabled={ads.length < pageSize} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">{t('feed.next')} →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustedFeedPage;
