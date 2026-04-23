// src/pages/TrustedFeedPage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import api from '../services/api';
import AdCard from '../components/AdCard';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Jobs', 'Services', 'Business', 'Events', 'Real Estate', 'Other'];

const TrustedFeedPage = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category !== 'All') params.category = category;
      if (location.trim()) params.location = location.trim();
      const { data } = await api.get('/ads', { params });
      setAds(data.ads);
    } catch {
      toast.error('Failed to load ads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, [category, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchAds(); };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-white mb-3">
            Trusted Ad Feed
          </motion.h1>
          <p className="text-white/50">Every listing here has passed our trust verification engine.</p>
        </div>

        {/* Search + Filter */}
        <form onSubmit={handleSearch} className="glass-card p-4 mb-8 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              className="input-field pl-9 py-2.5"
              placeholder="Search by location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary py-2.5">Search</button>
        </form>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                category === cat
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Ad Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card h-64 animate-pulse" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-24 text-white/40">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold">No ads found</p>
            <p className="text-sm mt-2">Try a different category or clear filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && ads.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Prev</button>
            <span className="text-white/50 text-sm">Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={ads.length < 12} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustedFeedPage;
