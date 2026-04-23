// src/controllers/reportController.js
const reportModel = require('../models/reportModel');
const adModel = require('../models/adModel');
const { validationResult } = require('express-validator');

/** POST /api/reports */
const submitReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { ad_id, reason, details } = req.body;

  try {
    const ad = await adModel.findById(ad_id);
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });

    const alreadyReported = await reportModel.alreadyReported(ad_id, req.user.id);
    if (alreadyReported) {
      return res.status(409).json({ error: 'You have already reported this ad.' });
    }

    const report = await reportModel.create({
      adId: ad_id,
      userId: req.user.id,
      reason,
      details,
    });

    // Increment report count on ad (auto-flags if >= 3 reports)
    await adModel.incrementReportCount(ad_id);

    return res.status(201).json({ report, message: 'Report submitted. Thank you for keeping the platform safe.' });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
};

module.exports = { submitReport };
