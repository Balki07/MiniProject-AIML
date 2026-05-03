// src/services/verificationEngine.js
// ─────────────────────────────────────────────────────────────────────────────
//  The core trust-scoring engine that decides if an ad is auto-approved,
//  sent to admin review, or auto-rejected.
// ─────────────────────────────────────────────────────────────────────────────

/** Scam / fraud keywords to detect */
const SCAM_KEYWORDS = [
  'earn money fast', 'guaranteed income', 'work from home opportunity',
  'make money online', '100% guaranteed', 'no experience needed',
  'get rich', 'financial freedom', 'passive income guarantee',
  'investment scheme', 'double your money', 'lottery winner',
  'unclaimed prize', 'click here to earn', 'earn ₹5000 daily',
  'earn 5000 daily', 'earn $500 daily', 'forex robot',
  'crypto guaranteed', 'mlm opportunity', 'pyramid', 'ponzi',
  'miracle cure', 'weight loss guarantee', 'work from home no experience',
  'be your own boss from home', 'limited time offer 100%',
];

/** High-risk punctuation / ALL CAPS ratio check */
const isSuspiciousFormat = (text) => {
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  const exclamations = (text.match(/!/g) || []).length;
  return capsRatio > 0.5 || exclamations > 5;
};

/**
 * Run the verification engine on an ad submission
 *
 * @param {object} ad   - { title, description, category, location, imageUrl }
 * @param {object} user - { is_verified, approved_count, trust_level }
 *
 * @returns {object} { trust_score, status, auto_processed, rejection_reason }
 */
const evaluate = (ad, user) => {
  let score = 50; // neutral baseline
  const flags = [];

  // ── STEP 1: Scam keyword detection ──────────────────────────────────────
  const fullText = `${ad.title} ${ad.description}`.toLowerCase();
  const foundKeywords = SCAM_KEYWORDS.filter((kw) => fullText.includes(kw));

  if (foundKeywords.length > 0) {
    score -= 40;
    flags.push(`Suspicious keywords detected: ${foundKeywords.slice(0, 3).join(', ')}`);
  }

  // ── STEP 2: Suspicious formatting ───────────────────────────────────────
  if (isSuspiciousFormat(ad.title + ' ' + ad.description)) {
    score -= 15;
    flags.push('Suspicious formatting (excessive caps/exclamations)');
  }

  // ── STEP 3: Content quality ──────────────────────────────────────────────
  if (!ad.description || ad.description.trim().length < 50) {
    score -= 10;
    flags.push('Description too short (< 50 chars)');
  } else if (ad.description.trim().length >= 150) {
    score += 10; // reward thorough descriptions
  }

  if (!ad.title || ad.title.trim().length < 5) {
    score -= 10;
    flags.push('Title too short');
  }

  if (!ad.location) {
    score -= 5;
    flags.push('Location missing');
  }

  if (!ad.imageUrl) {
    score -= 5; // slight penalty for no image
  } else {
    score += 5; // bonus for having an image
  }

  // ── STEP 4: User trust bonuses ───────────────────────────────────────────
  if (user.is_verified) {
    score += 30;
  }

  if (user.approved_count > 0) {
    score += 20; // has a clean track record
  }

  if (user.trust_level >= 70) {
    score += 10; // high-trust user bonus
  }

  // ── Clamp to [0, 100] ────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── STEP 5: Decision ─────────────────────────────────────────────────────
  // All ads now go to pending for manual admin review, regardless of score.
  let status = 'pending';
  let autoProcessed = false;
  let rejectionReason = null;

  return {
    trust_score: score,
    status,
    auto_processed: autoProcessed,
    rejection_reason: rejectionReason,
    flags, // internal — used for debugging, not returned to user
  };
};

module.exports = { evaluate, SCAM_KEYWORDS };
