// backend/generate-reports.js
// Backfill script: Generate PDF reports for all approved ads that don't have reports yet
require('dotenv').config();
const { query } = require('./src/config/db');
const reportModel = require('./src/models/reportModel');
const adModel = require('./src/models/adModel');
const userModel = require('./src/models/userModel');
const verificationEngine = require('./src/services/verificationEngine');
const pdfReportService = require('./src/services/pdfReportService');

const generateReportsForApprovedAds = async () => {
  try {
    console.log('🔍 Finding approved ads without reports...');

    // Get all approved ads that don't have reports
    const res = await query(`
      SELECT a.* FROM advertisements a
      LEFT JOIN ad_approval_reports r ON a.id = r.ad_id
      WHERE a.status = 'approved' AND r.id IS NULL
      ORDER BY a.created_at DESC
    `);

    const ads = res.rows;
    console.log(`📊 Found ${ads.length} approved ads without reports\n`);

    if (ads.length === 0) {
      console.log('✅ All approved ads already have reports!');
      process.exit(0);
    }

    let generated = 0;
    let failed = 0;

    for (let i = 0; i < ads.length; i++) {
      const ad = ads[i];
      const progress = `[${i + 1}/${ads.length}]`;

      try {
        console.log(`${progress} Processing: ${ad.title}`);

        // Get ad owner
        const adOwner = await userModel.findById(ad.user_id);
        if (!adOwner) {
          console.log(`  ⚠️  Owner not found, skipping`);
          failed++;
          continue;
        }

        // Run verification engine for snapshot
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

        // Get analytics
        const analytics = await reportModel.getAdAnalytics(ad.id);

        // Trust analysis (use current trust level as baseline)
        const trustAnalysis = {
          newTrust: adOwner.trust_level,
          note: 'Backfilled after approval',
        };

        // Create approval report record
        const approvalReport = await reportModel.createApprovalReport({
          adId: ad.id,
          adminId: null, // No admin on backfill
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
          'System (Backfill)'
        );

        // Update report with PDF path
        await reportModel.updateReportPdfPath(approvalReport.id, pdfUrl);

        console.log(`  ✅ Report generated: ${pdfUrl}`);
        generated++;
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Generated: ${generated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${ads.length}\n`);

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
};

generateReportsForApprovedAds();
