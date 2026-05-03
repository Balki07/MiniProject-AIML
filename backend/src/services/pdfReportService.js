const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const REPORTS_DIR = path.join(__dirname, '../../reports');

const ensureReportsDir = () => {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
};

const generateApprovalReport = (ad, verification, trustAnalysis, analytics, adminName) => {
  return new Promise((resolve, reject) => {
    try {
      ensureReportsDir();
      const reportId = randomUUID();
      const filename = `approval-${ad.id.slice(0, 8)}-${reportId.slice(0, 8)}.pdf`;
      const filepath = path.join(REPORTS_DIR, filename);
      const url = `/reports/${filename}`;

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Advertisement Approval Report', { align: 'center' });
      doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      // Section: Ad Details
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Advertisement Details');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Title: ${ad.title}`);
      doc.text(`Category: ${ad.category}`);
      doc.text(`Location: ${ad.location || 'N/A'}`);
      doc.text(`Status: ${ad.status.toUpperCase()}`);
      doc.text(`Created: ${new Date(ad.created_at).toLocaleString()}`);
      doc.moveDown(0.5);

      // Section: Trust & Verification
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Verification Results');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Trust Score: ${verification?.trust_score || 0}/100`);
      if (verification?.flags && verification.flags.length > 0) {
        doc.text('Flags:');
        verification.flags.forEach(flag => doc.text(`  • ${flag}`));
      } else {
        doc.text('Flags: None');
      }
      doc.moveDown(0.5);

      // Section: Description (truncated)
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Description');
      doc.fontSize(9).font('Helvetica').text((ad.description || '').slice(0, 500), { align: 'left' });
      doc.moveDown(0.5);

      // Section: Trust Analysis
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Trust Analysis');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Updated Trust Level: ${trustAnalysis?.newTrust || 'N/A'}/100`);
      doc.text(`Note: ${trustAnalysis?.note || 'N/A'}`);
      doc.moveDown(0.5);

      // Section: Analytics (30-day snapshot)
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Engagement (30 days)');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Impressions: ${analytics?.totals?.impressions || 0}`);
      doc.text(`Clicks: ${analytics?.totals?.clicks || 0}`);
      doc.text(`CTR: ${analytics?.totals?.ctr || 0}%`);
      doc.moveDown(0.5);

      // Section: Moderation
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Moderation');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Approved By: ${adminName}`);
      doc.text(`Approval Date: ${new Date().toLocaleString()}`);
      doc.moveDown(1);

      // Footer
      doc.fontSize(8).fillColor('#999').text('This is an official record of advertisement approval. For audit and compliance purposes only.', {
        align: 'center',
      });

      doc.end();

      stream.on('finish', () => {
        resolve({ filename, url, filepath });
      });

      stream.on('error', reject);
      doc.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateApprovalReport };
