// src/controllers/adminController.js
const adModel = require('../models/adModel');
const userModel = require('../models/userModel');
const reportModel = require('../models/reportModel');
const trustService = require('../services/trustService');

/** GET /api/admin/ads?status=pending|approved|rejected|flagged */
const getAdsByStatus = async (req, res) => {
  const { status = 'pending', page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const ads = await adModel.getByStatus({ status, limit: parseInt(limit), offset });
    return res.json({ ads });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load ads.' });
  }
};

/** PUT /api/admin/ads/:id/status — Approve or reject */
const moderateAd = async (req, res) => {
  const { status, rejection_reason } = req.body;
  const validStatuses = ['approved', 'rejected', 'removed', 'flagged'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const ad = await adModel.updateStatus(req.params.id, {
      status,
      rejectionReason: rejection_reason || null,
    });
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });

    // If approved, increment user's approved_count
    if (status === 'approved') {
      await userModel.incrementAdStats(ad.user_id, { incrementApproved: true });
    }

    // Recalculate user trust after moderation
    await trustService.recalculate(ad.user_id);

    return res.json({ ad, message: `Ad ${status} successfully.` });
  } catch (err) {
    console.error('Moderate ad error:', err);
    return res.status(500).json({ error: 'Failed to update ad status.' });
  }
};

/** POST /api/admin/users/:id/verify — Manually verify a user */
const verifyUser = async (req, res) => {
  try {
    await userModel.verify(req.params.id);
    await trustService.recalculate(req.params.id);
    return res.json({ message: 'User verified successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify user.' });
  }
};

/** GET /api/admin/analytics — Dashboard stats */
const getAnalytics = async (req, res) => {
  try {
    const [adCounts, userCount, openReports] = await Promise.all([
      adModel.getCounts(),
      userModel.count(),
      reportModel.countOpen(),
    ]);

    const fraudRate = adCounts.total > 0
      ? Math.round((parseInt(adCounts.rejected, 10) / parseInt(adCounts.total, 10)) * 100)
      : 0;

    return res.json({
      users: { total: userCount },
      ads: adCounts,
      reports: { open: openReports },
      fraud_rate: fraudRate,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
};

/** GET /api/admin/reports */
const getReports = async (req, res) => {
  try {
    const { adId } = req.query;
    if (adId) {
      const reports = await reportModel.getByAd(adId);
      return res.json({ reports });
    }
    return res.status(400).json({ error: 'adId required.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load reports.' });
  }
};

/** GET /api/admin/users */
const getUsers = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const users = await userModel.getAll({ limit: parseInt(limit), offset });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load users.' });
  }
};

module.exports = { getAdsByStatus, moderateAd, verifyUser, getAnalytics, getReports, getUsers };
