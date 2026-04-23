// src/models/reportModel.js
const { query } = require('../config/db');

const reportModel = {
  async create({ adId, userId, reason, details }) {
    const res = await query(
      `INSERT INTO reports (ad_id, user_id, reason, details)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [adId, userId, reason, details || null]
    );
    return res.rows[0];
  },

  async getByAd(adId) {
    const res = await query(
      `SELECT r.*, u.name AS reporter_name FROM reports r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.ad_id = $1 ORDER BY r.created_at DESC`,
      [adId]
    );
    return res.rows;
  },

  async updateStatus(id, status) {
    await query('UPDATE reports SET status=$1 WHERE id=$2', [status, id]);
  },

  /** Check if a user already reported this ad */
  async alreadyReported(adId, userId) {
    const res = await query(
      'SELECT id FROM reports WHERE ad_id=$1 AND user_id=$2',
      [adId, userId]
    );
    return res.rows.length > 0;
  },

  async countOpen() {
    const res = await query(`SELECT COUNT(*) FROM reports WHERE status='open'`);
    return parseInt(res.rows[0].count, 10);
  },
};

module.exports = reportModel;
