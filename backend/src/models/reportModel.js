// src/models/reportModel.js
const { query } = require('../config/db');

const reportModel = {
  async ensureApprovalTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS ad_approval_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ad_id UUID REFERENCES advertisements(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ad_snapshot JSONB,
        verification JSONB,
        trust_analysis JSONB,
        analytics JSONB,
        pdf_path VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  },

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

  // Create an approval-level report after admin approves an ad
  async createApprovalReport({ adId, adminId, adSnapshot, verification, trustAnalysis, analytics }) {
    await reportModel.ensureApprovalTable();
    const res = await query(
      `INSERT INTO ad_approval_reports (ad_id, admin_id, ad_snapshot, verification, trust_analysis, analytics)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [adId, adminId, adSnapshot || null, verification || null, trustAnalysis || null, analytics || null]
    );
    return res.rows[0];
  },

  async getApprovalReportByAd(adId) {
    await reportModel.ensureApprovalTable();
    const res = await query(
      `SELECT * FROM ad_approval_reports WHERE ad_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [adId]
    );
    return res.rows[0] || null;
  },

  async updateReportPdfPath(approvalReportId, pdfPath) {
    await query(
      `UPDATE ad_approval_reports SET pdf_path = $1, updated_at = NOW() WHERE id = $2`,
      [pdfPath, approvalReportId]
    );
  },

  // Analytics helper: totals + 30-day daily series
  async getAdAnalytics(adId) {
    // Totals from advertisements table
    const totalsRes = await query(
      `SELECT impressions, clicks, report_count FROM advertisements WHERE id = $1`,
      [adId]
    );
    const totals = totalsRes.rows[0] || { impressions: 0, clicks: 0, report_count: 0 };

    // Time series from ad_events for last 30 days
    const tsRes = await query(
      `SELECT date_trunc('day', created_at) AS day, event_type, COUNT(*) AS cnt
       FROM ad_events
       WHERE ad_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day, event_type
       ORDER BY day ASC`,
      [adId]
    );

    const seriesMap = {};
    tsRes.rows.forEach((r) => {
      const day = r.day.toISOString().slice(0,10);
      seriesMap[day] = seriesMap[day] || { impressions: 0, clicks: 0 };
      if (r.event_type === 'impression') seriesMap[day].impressions = parseInt(r.cnt, 10);
      if (r.event_type === 'click') seriesMap[day].clicks = parseInt(r.cnt, 10);
    });

    // Build arrays for last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days.push({ date: key, impressions: seriesMap[key]?.impressions || 0, clicks: seriesMap[key]?.clicks || 0 });
    }

    const ctr = totals && totals.impressions ? Math.round((parseInt(totals.clicks || 0,10) / parseInt(totals.impressions || 0,10)) * 10000)/100 : 0;

    return { totals: { impressions: parseInt(totals.impressions || 0,10), clicks: parseInt(totals.clicks || 0,10), reports: parseInt(totals.report_count || 0,10), ctr }, series: days };
  }
};

module.exports = reportModel;
