// src/models/adModel.js
const { query } = require('../config/db');

const adModel = {
  /** Create a new advertisement */
  async create({ userId, title, description, category, location, imageUrl, trustScore, status, autoProcessed, rejectionReason }) {
    const res = await query(
      `INSERT INTO advertisements
         (user_id, title, description, category, location, image_url, trust_score, status, auto_processed, rejection_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [userId, title, description, category, location || null, imageUrl || null,
       trustScore, status, autoProcessed, rejectionReason || null]
    );
    return res.rows[0];
  },

  /** Find ad by ID (joins user info) */
  async findById(id) {
    const res = await query(
      `SELECT a.*, u.name AS vendor_name, u.email AS vendor_email,
              u.is_verified AS vendor_verified, u.trust_level AS vendor_trust
       FROM advertisements a
       JOIN users u ON u.id = a.user_id
       WHERE a.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  /** Public trusted feed: approved ads sorted by trust score */
  async getTrustedFeed({ category, location, limit = 20, offset = 0 }) {
    const conditions = [`a.status = 'approved'`];
    const params = [];
    let idx = 1;

    if (category) { conditions.push(`a.category = $${idx++}`); params.push(category); }
    if (location) { conditions.push(`a.location ILIKE $${idx++}`); params.push(`%${location}%`); }

    params.push(limit, offset);

    const res = await query(
      `SELECT a.*, u.name AS vendor_name, u.is_verified AS vendor_verified,
              u.trust_level AS vendor_trust
       FROM advertisements a
       JOIN users u ON u.id = a.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.is_featured DESC, a.trust_score DESC, a.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );
    return res.rows;
  },

  /** Get ads by a specific user */
  async getByUser(userId) {
    const res = await query(
      `SELECT * FROM advertisements WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  /** Admin: get ads filtered by status */
  async getByStatus({ status, limit = 50, offset = 0 }) {
    const res = await query(
      `SELECT a.*, u.name AS vendor_name, u.email AS vendor_email, u.is_verified AS vendor_verified
       FROM advertisements a
       JOIN users u ON u.id = a.user_id
       WHERE a.status = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return res.rows;
  },

  /** Update ad status (admin moderation) */
  async updateStatus(id, { status, adminMessage }) {
    const res = await query(
      `UPDATE advertisements
         SET status=$1, admin_message=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [status, adminMessage || null, id]
    );
    return res.rows[0];
  },

  /** Increment impression or click count */
  async incrementEvent(id, type) {
    const col = type === 'click' ? 'clicks' : 'impressions';
    await query(`UPDATE advertisements SET ${col} = ${col} + 1 WHERE id = $1`, [id]);
  },

  /** Increment report count and flag if threshold exceeded */
  async incrementReportCount(id) {
    const res = await query(
      `UPDATE advertisements
         SET report_count = report_count + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING report_count, status`,
      [id]
    );
    const ad = res.rows[0];
    // Auto-flag if 3 or more reports
    if (ad && ad.report_count >= 3 && ad.status === 'approved') {
      await query(
        `UPDATE advertisements SET status='flagged', updated_at=NOW() WHERE id=$1`,
        [id]
      );
    }
    return ad;
  },

  /** Admin analytics counts */
  async getCounts() {
    const res = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status='pending')   AS pending,
         COUNT(*) FILTER (WHERE status='approved')  AS approved,
         COUNT(*) FILTER (WHERE status='rejected')  AS rejected,
         COUNT(*) FILTER (WHERE status='flagged')   AS flagged,
         COUNT(*) FILTER (WHERE auto_processed=TRUE) AS auto_processed,
         COUNT(*)                                    AS total
       FROM advertisements`
    );
    return res.rows[0];
  },

  /** User: edit rejected ad and resubmit to pending moderation */
  async updateRejectedByOwner(id, userId, { title, description, category, location, imageUrl, trustScore }) {
    const res = await query(
      `UPDATE advertisements
         SET title=$1,
             description=$2,
             category=$3,
             location=$4,
             image_url=$5,
             trust_score=$6,
             status='pending',
             auto_processed=FALSE,
             rejection_reason=NULL,
             admin_message=NULL,
             updated_at=NOW()
       WHERE id=$7 AND user_id=$8
       RETURNING *`,
      [title, description, category, location || null, imageUrl || null, trustScore, id, userId]
    );
    return res.rows[0] || null;
  },
};

module.exports = adModel;
