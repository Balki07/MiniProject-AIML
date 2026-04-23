// src/components/AdCard.jsx
import { motion } from 'framer-motion';
import { MapPin, Phone, Star, Clock } from 'lucide-react';
import TrustBadge from './TrustBadge';
import { Link } from 'react-router-dom';

const AdCard = ({ ad, onClick }) => {
  const isNew = (Date.now() - new Date(ad.created_at)) < 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-5 hover:border-brand-500/50 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
    >
      {/* Featured ribbon */}
      {ad.is_featured && (
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-full font-semibold">
            <Star size={10} fill="currentColor" /> Featured
          </span>
        </div>
      )}

      {/* New badge */}
      {isNew && !ad.is_featured && (
        <div className="absolute top-3 right-3">
          <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-1 rounded-full font-semibold">New</span>
        </div>
      )}

      {/* Ad Image */}
      {ad.image_url && (
        <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-white/5">
          <img
            src={`http://localhost:5000${ad.image_url}`}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Category */}
      <span className="inline-block text-xs font-semibold bg-brand-500/10 text-brand-400 px-2.5 py-1 rounded-lg mb-3">
        {ad.category}
      </span>

      {/* Title */}
      <Link to={`/ads/${ad.id}`} className="block">
        <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-brand-400 transition-colors line-clamp-2">
          {ad.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-3">
        {ad.description}
      </p>

      {/* Trust Score */}
      <div className="mb-4">
        <TrustBadge score={ad.trust_score} />
        {ad.vendor_verified && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            ✓ Verified Vendor
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-white/40 text-xs border-t border-white/5 pt-3">
        <span className="flex items-center gap-1">
          <MapPin size={11} /> {ad.location || 'Location not specified'}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {new Date(ad.created_at).toLocaleDateString('en-IN')}
        </span>
      </div>
    </motion.div>
  );
};

export default AdCard;
