import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const API_ORIGIN = (api.defaults.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_ORIGIN}${imageUrl}`;
};

const DepartmentBoardPage = ({ defaultSlug = 'dashboard' }) => {
  const { t, language } = useLanguage();
  const params = useParams();
  const slug = params.slug || defaultSlug;
  const [items, setItems] = useState([]);
  const [layoutUpdatedAt, setLayoutUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);

  const boardHeight = Math.max(
    760,
    ...items.map((item) => (Number(item.y) || 0) + (Number(item.height) || 0) + 40)
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/ads/layout/${slug}`);
        setItems(data.items || []);
        setLayoutUpdatedAt(data.layout?.updated_at || null);
      } catch {
        setItems([]);
        setLayoutUpdatedAt(null);
        setSelectedAd(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="hero-aura" aria-hidden="true" />
      <div className="max-w-[1320px] mx-auto">
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <h1 className="text-3xl font-black text-white capitalize">{slug === 'dashboard' ? t('dashboard.title') : `${slug?.replace('-', ' ')} ${t('departmentBoard.titleSuffix')}`}</h1>
            <p className="text-white/75 text-sm mt-1">{t('departmentBoard.subtitle')}</p>
            {!loading && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white/80">
                  {t('departmentBoard.totalAds', { count: items.length })}
                </span>
                <span className="px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white/80">
                  {t('departmentBoard.updatedAt', {
                    date: layoutUpdatedAt
                      ? new Date(layoutUpdatedAt).toLocaleString(language === 'fr' ? 'fr-FR' : language === 'ta' ? 'ta-IN' : 'en-IN')
                      : t('common.na'),
                  })}
                </span>
              </div>
            )}
          </div>
          <Link to="/dashboard" className="btn-secondary text-sm">{t('departmentBoard.backToFeed')}</Link>
        </div>

        {loading ? (
          <div className="glass-card h-[760px] animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <div className="relative mx-auto rounded-2xl border border-white/20 bg-slate-950/70 overflow-hidden shadow-[0_34px_66px_-30px_rgba(0,0,0,0.85)]" style={{ width: 1120, height: boardHeight }}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ scale: 1.02, rotateX: 3, rotateY: -3 }}
                  className="absolute rounded-xl overflow-hidden border border-white/20 shadow-lg cursor-pointer transition-all duration-200 hover:border-white/45 hover:shadow-[0_20px_40px_-20px_rgba(72,215,255,0.85)]"
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    zIndex: item.z_index,
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAd(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAd(item);
                    }
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-xs">{t('departmentBoard.noImage')}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                    <p className="text-white text-xs font-semibold line-clamp-2">{item.title}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                </motion.div>
              ))}

              {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white/35 text-sm">
                  {t('departmentBoard.empty')}
                </div>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedAd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.97, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, y: 14, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-3xl rounded-2xl border border-white/20 bg-slate-900/95 overflow-hidden shadow-[0_36px_80px_-26px_rgba(0,0,0,0.92)]"
              >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-black/40 min-h-[280px] relative">
                  {selectedAd.image_url ? (
                    <img
                      src={resolveImageUrl(selectedAd.image_url)}
                      alt={selectedAd.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[280px] flex items-center justify-center text-white/40 text-sm">
                      {t('departmentBoard.noImage')}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                </div>

                <div className="p-5 md:p-6 bg-gradient-to-b from-white/10 to-white/5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl font-black text-white leading-tight">{selectedAd.title}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedAd(null)}
                      className="text-white/50 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10"
                    >
                      {t('common.close')}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    <span className="px-2 py-1 rounded-full border border-white/40 bg-white/10 text-white">
                      {selectedAd.category}
                    </span>
                    <span className="px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/70">
                      {selectedAd.location || t('common.na')}
                    </span>
                  </div>

                  <p className="text-white/80 text-sm leading-relaxed mb-5 whitespace-pre-line">
                    {selectedAd.description || t('departmentBoard.noDescription')}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="text-white/60">
                      <span className="text-white/40">{t('departmentBoard.shopName')}:</span>{' '}
                      <span className="text-white/90">{selectedAd.shop_name || selectedAd.vendor_name || t('common.na')}</span>
                    </div>
                    <div className="text-white/60">
                      <span className="text-white/40">{t('departmentBoard.shopOwner')}:</span>{' '}
                      <span className="text-white/90">{selectedAd.vendor_name || t('common.na')}</span>
                    </div>
                    <div className="text-white/60">
                      <span className="text-white/40">{t('departmentBoard.shopPhone')}:</span>{' '}
                      <span className="text-white/90">{selectedAd.shop_phone || t('common.na')}</span>
                    </div>
                    <div className="text-white/60">
                      <span className="text-white/40">{t('departmentBoard.shopAddress')}:</span>{' '}
                      <span className="text-white/90">{selectedAd.shop_address || t('common.na')}</span>
                    </div>
                    <div className="text-white/60">
                      <span className="text-white/40">{t('departmentBoard.shopAbout')}:</span>{' '}
                      <span className="text-white/90">{selectedAd.shop_bio || t('common.na')}</span>
                    </div>
                  </div>
                </div>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DepartmentBoardPage;
