// src/components/TrustBadge.jsx
import { ShieldCheck, ShieldAlert, ShieldBan } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const getTrustLevel = (score, t) => {
  if (score >= 80) return { label: t('trust.high'), cls: 'trust-badge-high', emoji: '🛡️', icon: ShieldCheck };
  if (score >= 50) return { label: t('trust.verified'), cls: 'trust-badge-medium', emoji: '✅', icon: ShieldAlert };
  return { label: t('trust.low'), cls: 'trust-badge-low', emoji: '⚠️', icon: ShieldBan };
};

const TrustBadge = ({ score, showScore = true, compact = false }) => {
  const { t } = useLanguage();
  const level = getTrustLevel(score, t);
  const Icon = level.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${level.cls}`}>
        <Icon size={10} /> {score}%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${level.cls}`}>
      {level.emoji} {level.label} {showScore && <span className="opacity-70">({score})</span>}
    </span>
  );
};

export default TrustBadge;
