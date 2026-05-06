// src/controllers/adminController.js
const adModel = require('../models/adModel');
const userModel = require('../models/userModel');
const reportModel = require('../models/reportModel');
const trustService = require('../services/trustService');
const { sendModerationNotification } = require('../services/emailService');
const verificationEngine = require('../services/verificationEngine');
const layoutModel = require('../models/layoutModel');
const pdfReportService = require('../services/pdfReportService');

/** POST /api/admin/layout/departments */
const createLayoutDepartment = async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'name is required.' });
  }

  const derivedSlug = slug && String(slug).trim()
    ? String(slug).trim()
    : String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50);

  try {
    const department = await layoutModel.createDepartment({ slug: derivedSlug, name: String(name).trim() });
    return res.json({ department, message: 'Department created.' });
  } catch (err) {
    console.error('Create department error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create department.' });
  }
};

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
  const { status, admin_message } = req.body;
  const validStatuses = ['approved', 'rejected', 'removed', 'flagged'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const ad = await adModel.updateStatus(req.params.id, {
      status,
      adminMessage: admin_message || null,
    });
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });

    // If approved, increment user's approved_count
    if (status === 'approved') {
      await userModel.incrementAdStats(ad.user_id, { incrementApproved: true });
    }

    // Recalculate user trust after moderation
    const newTrust = await trustService.recalculate(ad.user_id);

    // Send user notification email (non-blocking for moderation success)
    const adOwner = await userModel.findById(ad.user_id);
    if (adOwner?.email) {
      sendModerationNotification({
        to: adOwner.email,
        userName: adOwner.name,
        adTitle: ad.title,
        status,
        adminMessage: admin_message || null,
        trustScore: ad.trust_score,
        category: ad.category,
        location: ad.location,
      }).catch((emailErr) => {
        console.error('Moderation email error:', emailErr.message);
      });
    }

    // If approved, create a comprehensive approval report for traceability and analytics
    if (status === 'approved') {
      try {
        // Re-run verification to capture the snapshot at approval time
        const verification = verificationEngine.evaluate(
          {
            title: ad.title,
            description: ad.description,
            category: ad.category,
            location: ad.location,
            imageUrl: ad.image_url,
          },
          adOwner
        );

        const analytics = await reportModel.getAdAnalytics(ad.id);

        const trustAnalysis = {
          newTrust,
          note: 'Recalculated after moderation',
        };

        const approvalReport = await reportModel.createApprovalReport({
          adId: ad.id,
          adminId: req.user.id,
          adSnapshot: ad,
          verification,
          trustAnalysis,
          analytics,
        });

        // Generate PDF report
        try {
          const { url: pdfUrl } = await pdfReportService.generateApprovalReport(
            ad,
            verification,
            trustAnalysis,
            analytics,
            req.user.name || 'Admin'
          );
          await reportModel.updateReportPdfPath(approvalReport.id, pdfUrl);
        } catch (pdfErr) {
          console.error('Failed to generate PDF report:', pdfErr);
        }
      } catch (reportErr) {
        console.error('Failed to create approval report:', reportErr);
      }
    }

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

/** GET /api/admin/ads/:id/verification-preview — Re-run verification for flagged ads */
const getVerificationPreview = async (req, res) => {
  try {
    const ad = await adModel.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });
    if (ad.status !== 'flagged') {
      return res.status(400).json({ error: 'Verification preview is only available for flagged ads.' });
    }

    const adOwner = await userModel.findById(ad.user_id);
    if (!adOwner) return res.status(404).json({ error: 'Ad owner not found.' });

    const result = verificationEngine.evaluate(
      {
        title: ad.title,
        description: ad.description,
        category: ad.category,
        location: ad.location,
        imageUrl: ad.image_url,
      },
      adOwner
    );

    const recommendation = result.trust_score >= 60 ? 'publish' : 'remove';

    return res.json({
      ad_id: ad.id,
      trust_score: result.trust_score,
      flags: result.flags,
      recommendation,
    });
  } catch (err) {
    console.error('Verification preview error:', err);
    return res.status(500).json({ error: 'Failed to run verification preview.' });
  }
};

/** GET /api/admin/layout/departments */
const getLayoutDepartments = async (_req, res) => {
  try {
    const departments = await layoutModel.getDepartments();
    return res.json({ departments });
  } catch (err) {
    console.error('Load departments error:', err);
    return res.status(500).json({ error: 'Failed to load departments.' });
  }
};

/** GET /api/admin/layout/:departmentSlug/draft */
const getLayoutDraft = async (req, res) => {
  try {
    const data = await layoutModel.getLayoutByDepartment({
      departmentSlug: req.params.departmentSlug,
      status: 'draft',
    });
    return res.json(data);
  } catch (err) {
    console.error('Load draft layout error:', err);
    return res.status(500).json({ error: 'Failed to load draft layout.' });
  }
};

/** PUT /api/admin/layout/:departmentSlug/draft */
const saveLayoutDraft = async (req, res) => {
  const { items = [] } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array.' });
  }

  try {
    const layout = await layoutModel.upsertDraftLayout({
      departmentSlug: req.params.departmentSlug,
      adminId: req.user.id,
      items,
    });
    return res.json({ layout, message: 'Draft layout saved.' });
  } catch (err) {
    console.error('Save draft layout error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save draft layout.' });
  }
};

/** POST /api/admin/layout/:departmentSlug/publish */
const publishLayout = async (req, res) => {
  try {
    const layout = await layoutModel.publishLayout({
      departmentSlug: req.params.departmentSlug,
      adminId: req.user.id,
      items: Array.isArray(req.body?.items) ? req.body.items : null,
    });
    return res.json({ layout, message: 'Layout published successfully.' });
  } catch (err) {
    console.error('Publish layout error:', err);
    return res.status(500).json({ error: err.message || 'Failed to publish layout.' });
  }
};

/** GET /api/admin/ads/:id/report — Get latest approval report for an ad */
const getApprovalReport = async (req, res) => {
  try {
    const report = await reportModel.getApprovalReportByAd(req.params.id);
    if (!report) return res.status(404).json({ error: 'Approval report not found.' });
    return res.json({ report });
  } catch (err) {
    console.error('Get approval report error:', err);
    return res.status(500).json({ error: 'Failed to load approval report.' });
  }
};

/** POST /api/admin/ads/:id/regenerate-report — Regenerate PDF report for a single ad */
const regenerateSingleReport = async (req, res) => {
  try {
    const ad = await adModel.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });
    if (ad.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved ads can have reports generated.' });
    }

    const adOwner = await userModel.findById(ad.user_id);
    if (!adOwner) return res.status(404).json({ error: 'Ad owner not found.' });

    // Re-run verification
    const verification = verificationEngine.evaluate(
      {
        title: ad.title,
        description: ad.description,
        category: ad.category,
        location: ad.location,
        imageUrl: ad.image_url,
      },
      adOwner
    );

    const analytics = await reportModel.getAdAnalytics(ad.id);
    const trustAnalysis = { newTrust: adOwner.trust_level, note: 'Regenerated by admin' };

    // Check if report exists; if so, delete old one
    const existingReport = await reportModel.getApprovalReportByAd(ad.id);
    if (existingReport) {
      // For now, we create a new one; old PDF remains in filesystem
    }

    // Create or update report
    const approvalReport = await reportModel.createApprovalReport({
      adId: ad.id,
      adminId: req.user.id,
      adSnapshot: ad,
      verification,
      trustAnalysis,
      analytics,
    });

    // Generate PDF
    const { url: pdfUrl } = await pdfReportService.generateApprovalReport(
      ad,
      verification,
      trustAnalysis,
      analytics,
      req.user.name || 'Admin'
    );

    await reportModel.updateReportPdfPath(approvalReport.id, pdfUrl);

    return res.json({ message: 'Report regenerated successfully.', report: approvalReport });
  } catch (err) {
    console.error('Regenerate report error:', err);
    return res.status(500).json({ error: 'Failed to regenerate report.' });
  }
};

/** POST /api/admin/regenerate-all-reports — Regenerate all missing reports for approved ads */
const regenerateAllReports = async (req, res) => {
  try {
    // Don't wait for completion; return immediately and process in background
    res.json({ message: 'Report generation started. Check progress via admin panel.' });

    // Background processing (non-blocking)
    setImmediate(async () => {
      try {
        const res = await query(`
          SELECT a.* FROM advertisements a
          LEFT JOIN ad_approval_reports r ON a.id = r.ad_id
          WHERE a.status = 'approved' AND r.id IS NULL
          LIMIT 100
        `);

        const ads = res.rows;
        console.log(`🔄 [Background] Regenerating ${ads.length} missing reports...`);

        for (const ad of ads) {
          try {
            const adOwner = await userModel.findById(ad.user_id);
            if (!adOwner) continue;

            const verification = verificationEngine.evaluate(
              {
                title: ad.title,
                description: ad.description,
                category: ad.category,
                location: ad.location,
                imageUrl: ad.image_url,
              },
              adOwner
            );

            const analytics = await reportModel.getAdAnalytics(ad.id);
            const trustAnalysis = { newTrust: adOwner.trust_level, note: 'Backfilled via admin endpoint' };

            const approvalReport = await reportModel.createApprovalReport({
              adId: ad.id,
              adminId: req.user.id,
              adSnapshot: ad,
              verification,
              trustAnalysis,
              analytics,
            });

            const { url: pdfUrl } = await pdfReportService.generateApprovalReport(
              ad,
              verification,
              trustAnalysis,
              analytics,
              req.user.name || 'Admin'
            );

            await reportModel.updateReportPdfPath(approvalReport.id, pdfUrl);
            console.log(`  ✅ Generated report for: ${ad.title}`);
          } catch (err) {
            console.error(`  ❌ Failed for ${ad.id}: ${err.message}`);
          }
        }

        console.log(`🔄 [Background] Report generation completed.`);
      } catch (err) {
        console.error('Background report generation error:', err);
      }
    });
  } catch (err) {
    console.error('Regenerate all reports error:', err);
    return res.status(500).json({ error: 'Failed to start report regeneration.' });
  }
};

/** GET /api/admin/ads/history?status=approved|rejected&limit=50&page=1 — Categorized ad history */
const getAdHistory = async (req, res) => {
  const { status = 'approved', page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const ads = await adModel.getByStatus({
      status,
      limit: parseInt(limit),
      offset,
    });

    // Enrich with reports
    const enriched = await Promise.all(
      ads.map(async (ad) => {
        const report = status === 'approved' ? await reportModel.getApprovalReportByAd(ad.id) : null;
        return { ...ad, report };
      })
    );

    return res.json({ ads: enriched, page: parseInt(page), status });
  } catch (err) {
    console.error('Get ad history error:', err);
    return res.status(500).json({ error: 'Failed to load ad history.' });
  }
};

module.exports = {
  getAdsByStatus,
  moderateAd,
  verifyUser,
  getAnalytics,
  getReports,
  getUsers,
  getVerificationPreview,
  getLayoutDepartments,
  createLayoutDepartment,
  getLayoutDraft,
  saveLayoutDraft,
  publishLayout,
  getApprovalReport,
  getAdHistory,
  regenerateSingleReport,
  regenerateAllReports,
};
