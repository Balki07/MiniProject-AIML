// src/services/trustService.js
// Recalculates a user's trust level based on their ad history
const userModel = require('../models/userModel');
const { query } = require('../config/db');

/**
 * Recalculate and persist a user's trust level after an ad status change.
 * Formula:
 *   base = 50
 *   +20 if verified
 *   +30 * (approved_count / max(ad_count,1)) — approval ratio
 *   -10 per rejected ad (capped at -30)
 */
const recalculate = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) return;

  // Get ad history
  const res = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status='approved') AS approved,
       COUNT(*) FILTER (WHERE status='rejected') AS rejected,
       COUNT(*) AS total
     FROM advertisements WHERE user_id=$1`,
    [userId]
  );
  const { approved, rejected, total } = res.rows[0];

  let score = 50;
  if (user.is_verified) score += 20;

  const approvalRatio = total > 0 ? parseInt(approved, 10) / parseInt(total, 10) : 0;
  score += Math.round(30 * approvalRatio);

  const penaltyFromRejections = Math.min(30, parseInt(rejected, 10) * 10);
  score -= penaltyFromRejections;

  score = Math.max(0, Math.min(100, score));
  await userModel.updateTrustLevel(userId, score);
  return score;
};

module.exports = { recalculate };
