// src/controllers/adController.js
const { validationResult } = require('express-validator');
const adModel = require('../models/adModel');
const adEventModel = require('../models/adEventModel');
const userModel = require('../models/userModel');
const verificationEngine = require('../services/verificationEngine');
const trustService = require('../services/trustService');
const path = require('path');

/** POST /api/ads — Submit a new advertisement */
const createAd = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category, location } = req.body;
  const imageUrl = req.file
    ? `/uploads/ads/${req.file.filename}`
    : null;

  try {
    const user = req.user;

    // Run verification engine
    const result = verificationEngine.evaluate(
      { title, description, category, location, imageUrl },
      user
    );

    // Save the ad with engine result
    const ad = await adModel.create({
      userId: user.id,
      title,
      description,
      category,
      location,
      imageUrl,
      trustScore: result.trust_score,
      status: result.status,
      autoProcessed: result.auto_processed,
      rejectionReason: result.rejection_reason,
    });

    // Update user ad count
    await userModel.incrementAdStats(user.id, {
      incrementApproved: result.status === 'approved',
    });

    // Recalculate user trust level after ad submission
    await trustService.recalculate(user.id);

    return res.status(201).json({
      ad,
      verification: {
        trust_score: result.trust_score,
        status: result.status,
        auto_processed: result.auto_processed,
        message: getStatusMessage(result.status, result.auto_processed),
      },
    });
  } catch (err) {
    console.error('Create ad error:', err);
    return res.status(500).json({ error: 'Failed to submit ad.' });
  }
};

/** GET /api/ads — Public trusted feed */
const getFeed = async (req, res) => {
  const { category, location, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const ads = await adModel.getTrustedFeed({
      category,
      location,
      limit: parseInt(limit),
      offset,
    });
    return res.json({ ads, page: parseInt(page) });
  } catch (err) {
    console.error('Feed error:', err);
    return res.status(500).json({ error: 'Failed to load ads.' });
  }
};

/** GET /api/ads/my — Get current user's own ads */
const getMyAds = async (req, res) => {
  try {
    const ads = await adModel.getByUser(req.user.id);
    return res.json({ ads });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load your ads.' });
  }
};

/** GET /api/ads/:id — Get a single ad + record impression */
const getAdById = async (req, res) => {
  try {
    const ad = await adModel.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });
    if (ad.status !== 'approved' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'Ad not found.' });
    }

    // Record impression asynchronously (don't await to keep response fast)
    adModel.incrementEvent(ad.id, 'impression').catch(() => {});
    adEventModel.record({
      adId: ad.id,
      userId: req.user?.id || null,
      ipAddress: req.ip,
      eventType: 'impression',
    }).catch(() => {});

    return res.json({ ad });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load ad.' });
  }
};

/** POST /api/ads/:id/click — Track a click */
const trackClick = async (req, res) => {
  try {
    await adModel.incrementEvent(req.params.id, 'click');
    await adEventModel.record({
      adId: req.params.id,
      userId: req.user?.id || null,
      ipAddress: req.ip,
      eventType: 'click',
    });
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true }); // fail silently for analytics
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const getStatusMessage = (status, autoProcessed) => {
  if (status === 'approved' && autoProcessed) return '🎉 Your ad has been automatically approved and is now live!';
  if (status === 'rejected' && autoProcessed) return '❌ Your ad was automatically rejected due to policy violations.';
  return '⏳ Your ad is under review. An admin will approve it shortly.';
};

module.exports = { createAd, getFeed, getMyAds, getAdById, trackClick };
