// src/components/TrustBadge.jsx
export const getTrustLevel = (score) => {
  if (score >= 80) return { label: 'High Trust', cls: 'trust-badge-high', emoji: '🛡️' };
  if (score >= 50) return { label: 'Verified',   cls: 'trust-badge-medium', emoji: '✅' };
  return { label: 'Low Trust', cls: 'trust-badge-low', emoji: '⚠️' };
};

const TrustBadge = ({ score, showScore = true }) => {
  const level = getTrustLevel(score);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${level.cls}`}>
      {level.emoji} {level.label} {showScore && <span className="opacity-70">({score})</span>}
    </span>
  );
};

export default TrustBadge;
