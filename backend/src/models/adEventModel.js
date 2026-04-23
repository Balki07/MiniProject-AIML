// src/models/adEventModel.js
const { query } = require('../config/db');

const adEventModel = {
  async record({ adId, userId, ipAddress, eventType }) {
    await query(
      `INSERT INTO ad_events (ad_id, user_id, ip_address, event_type)
       VALUES ($1,$2,$3,$4)`,
      [adId, userId || null, ipAddress || null, eventType]
    );
  },

  async getStatsByAd(adId) {
    const res = await query(
      `SELECT event_type, COUNT(*) AS count
       FROM ad_events WHERE ad_id=$1 GROUP BY event_type`,
      [adId]
    );
    return res.rows;
  },
};

module.exports = adEventModel;
