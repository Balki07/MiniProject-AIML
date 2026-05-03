// src/components/AdCard.jsx
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import TrustBadge from './TrustBadge';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdCard = ({ ad, onClick }) => {
  const { t } = useLanguage();
  const isNew = (Date.now() - new Date(ad.created_at)) < 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card group cursor-pointer relative overflow-hidden hover:border-cyan-300/50 transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Badges floating on top */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        {ad.is_featured && (
          <span className="flex items-center gap-1 text-[10px] bg-fuchsia-500/90 backdrop-blur text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-[0_0_18px_rgba(255,95,214,0.3)]">
            <Star size={8} fill="currentColor" /> {t('card.featured')}
          </span>
        )}
        {isNew && !ad.is_featured && (
          <span className="text-[10px] bg-cyan-400/90 backdrop-blur text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-[0_0_18px_rgba(64,230,255,0.25)]">{t('card.new')}</span>
        )}
      </div>

      {/* Ad Image (Full Width) */}
      {ad.image_url ? (
        <div className="w-full bg-white/5 relative">
          <img
            src={ad.image_url.startsWith('http') ? ad.image_url : `http://localhost:5000${ad.image_url}`}
            alt={ad.title}
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="w-full h-32 bg-white/5 flex items-center justify-center border-b border-white/5">
           <span className="text-white/20 text-xs font-semibold">{t('card.noImage')}</span>
        </div>
      )}

      {/* Compact Info Section (No description, tight padding) */}
      <div className="p-3 bg-black/40 backdrop-blur-md">
        <span className="inline-block text-[10px] font-bold text-brand-400 mb-1 uppercase tracking-wider">
          {ad.category}
        </span>

        <Link to={`/ads/${ad.id}`} className="block">
          <h3 className="font-bold text-white text-sm sm:text-base leading-tight mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
            {ad.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-1">
          <TrustBadge score={ad.trust_score} compact={true} />
          {ad.vendor_verified && (
             <span className="text-[10px] font-bold text-emerald-400">✓ {t('card.verified')}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdCard;
