// src/services/emailService.js
// ─────────────────────────────────────────────────────────────────────────────
//  All transactional emails sent by JBAdX platform.
//  Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
// ─────────────────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');

let cachedTransporter = null;

const hasSmtpConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  if (!hasSmtpConfig()) return null;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
};

// ── Shared Email Wrapper ─────────────────────────────────────────────────────
const wrapEmail = (title, accentColor, badgeEmoji, badgeLabel, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header / Logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1f2e,#0d1117);border-radius:16px 16px 0 0;padding:28px 36px;border-bottom:1px solid #ffffff14;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="background:linear-gradient(135deg,#f6b73c,#f97316);padding:6px 12px;border-radius:8px;font-size:14px;font-weight:800;color:#fff;letter-spacing:1px;">⚡ JBAdX</span>
                  <span style="color:#ffffff55;font-size:12px;margin-left:10px;">Advertisement Express</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Badge Banner -->
        <tr>
          <td style="background:${accentColor};padding:18px 36px;text-align:center;">
            <span style="font-size:28px;">${badgeEmoji}</span>
            <div style="color:#fff;font-size:17px;font-weight:700;margin-top:4px;letter-spacing:0.5px;">${badgeLabel}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#161b2c;padding:32px 36px;border-radius:0 0 16px 16px;">
            ${body}
            <hr style="border:none;border-top:1px solid #ffffff12;margin:28px 0;" />
            <p style="color:#ffffff40;font-size:12px;text-align:center;margin:0;">
              This is an automated notification from <strong style="color:#f6b73c;">JBAdX</strong>.<br/>
              Please do not reply to this email. Visit your dashboard for more details.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Helper to render key-value rows ─────────────────────────────────────────
const row = (label, value, color = '#e2e8f0') => `
  <tr>
    <td style="color:#ffffff55;font-size:13px;padding:8px 0 4px;width:38%;">${label}</td>
    <td style="color:${color};font-size:13px;font-weight:600;padding:8px 0 4px;">${value}</td>
  </tr>`;

// ── Send helper ───────────────────────────────────────────────────────────────
const send = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping email to:', to);
    return;
  }
  const from = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, html });
};

// ─────────────────────────────────────────────────────────────────────────────
//  1. WELCOME EMAIL — sent on new user registration
// ─────────────────────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, userName }) => {
  const subject = '👋 Welcome to JBAdX — Pondicherry\'s Trusted Digital Wall!';
  const body = `
    <h2 style="color:#f6b73c;margin:0 0 8px;">Welcome, ${userName}! 🎉</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Your account has been successfully created on <strong style="color:#fff;">JBAdX</strong>.
      You can now post verified advertisements, track their performance, and reach a trusted local audience.
    </p>
    <div style="background:#0d1117;border:1px solid #ffffff15;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">To get started:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Step 1', 'Complete your profile (phone, company, address & bio)', '#f6b73c')}
        ${row('Step 2', 'Post your first ad for verification')}
        ${row('Step 3', 'Wait for admin approval — we\'ll email you!')}
      </table>
    </div>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="display:inline-block;background:linear-gradient(135deg,#f6b73c,#f97316);color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">
      Complete My Profile →
    </a>`;

  const html = wrapEmail(
    'Welcome',
    'linear-gradient(135deg, #1a3a2a, #064e3b)',
    '👋',
    'Account Created Successfully',
    body
  );
  await send({ to, subject, html });
};

// ─────────────────────────────────────────────────────────────────────────────
//  2. SUBMISSION CONFIRMATION — sent when user posts a new ad
// ─────────────────────────────────────────────────────────────────────────────
const sendSubmissionConfirmation = async ({ to, userName, adTitle, category, location, trustScore }) => {
  const subject = `⏳ Ad Submitted — "${adTitle}" is under review`;

  const scoreColor = trustScore >= 70 ? '#22c55e' : trustScore >= 50 ? '#f6b73c' : '#ef4444';
  const scoreLabel = trustScore >= 70 ? 'Good Score' : trustScore >= 50 ? 'Moderate Score' : 'Low Score — improve your ad';

  const body = `
    <h2 style="color:#fff;margin:0 0 8px;">Your Ad has been Submitted! ⏳</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#fff;">${userName}</strong>, your advertisement has been received and is now in the admin review queue.
      Our team will process it shortly and you'll receive another email once a decision is made.
    </p>
    <div style="background:#0d1117;border:1px solid #ffffff15;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Ad Submission Report</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Ad Title', adTitle)}
        ${row('Category', category || 'N/A')}
        ${row('Location', location || 'Not specified')}
        ${row('AI Trust Score', `${trustScore} / 100 — ${scoreLabel}`, scoreColor)}
        ${row('Current Status', '⏳ Pending Admin Review', '#f6b73c')}
      </table>
    </div>
    <p style="color:#64748b;font-size:13px;line-height:1.6;margin-bottom:20px;">
      💡 <strong style="color:#94a3b8;">Pro Tip:</strong> Ads with longer descriptions (150+ chars), clear images, and a specified location get higher trust scores and are reviewed faster.
    </p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">
      View My Dashboard →
    </a>`;

  const html = wrapEmail(
    'Submission',
    'linear-gradient(135deg, #1e3a5f, #1e293b)',
    '📋',
    'Ad Submitted for Verification',
    body
  );
  await send({ to, subject, html });
};

// ─────────────────────────────────────────────────────────────────────────────
//  3. MODERATION NOTIFICATION — sent when admin approves or rejects
// ─────────────────────────────────────────────────────────────────────────────
const sendModerationNotification = async ({ to, userName, adTitle, status, adminMessage, trustScore, category, location }) => {
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const statusLabel = isApproved ? 'Approved ✅' : isRejected ? 'Rejected ❌' : status.charAt(0).toUpperCase() + status.slice(1);
  const subject = isApproved
    ? `✅ Your Ad is LIVE — "${adTitle}"`
    : `❌ Ad Requires Attention — "${adTitle}"`;

  const accentGradient = isApproved
    ? 'linear-gradient(135deg, #064e3b, #065f46)'
    : 'linear-gradient(135deg, #4c1d1d, #7f1d1d)';
  const badgeEmoji = isApproved ? '✅' : '❌';
  const badgeLabel = isApproved ? 'Advertisement Approved & Live!' : 'Advertisement Rejected';

  const adminNote = adminMessage || 'No specific feedback was provided by the moderator.';

  const ctaUrl = isApproved
    ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/ads`
    : `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
  const ctaText = isApproved ? 'View My Ad on the Wall →' : 'Edit & Resubmit My Ad →';
  const ctaColor = isApproved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f97316,#dc2626)';

  const body = `
    <h2 style="color:#fff;margin:0 0 8px;">Hello, ${userName}!</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">
      ${isApproved
        ? 'Great news! Your advertisement has been reviewed and <strong style="color:#22c55e;">approved</strong>. It is now live on the JBAdX Digital Wall.'
        : 'Your advertisement has been reviewed and <strong style="color:#ef4444;">rejected</strong> by our moderation team. Please read the admin note below and resubmit after making the necessary changes.'}
    </p>
    <div style="background:#0d1117;border:1px solid #ffffff15;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Moderation Report</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Ad Title', adTitle)}
        ${row('Category', category || 'N/A')}
        ${row('Location', location || 'Not specified')}
        ${trustScore !== undefined ? row('Trust Score', `${trustScore} / 100`, trustScore >= 70 ? '#22c55e' : '#f6b73c') : ''}
        ${row('Final Status', statusLabel, isApproved ? '#22c55e' : '#ef4444')}
      </table>
    </div>
    <div style="background:${isApproved ? '#052e16' : '#450a0a'};border:1px solid ${isApproved ? '#16a34a40' : '#dc262640'};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;font-weight:600;">📝 Admin Note:</p>
      <p style="color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;">${adminNote}</p>
    </div>
    <a href="${ctaUrl}" style="display:inline-block;background:${ctaColor};color:#fff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">
      ${ctaText}
    </a>`;

  const html = wrapEmail('Moderation', accentGradient, badgeEmoji, badgeLabel, body);
  await send({ to, subject, html });
};

// ─────────────────────────────────────────────────────────────────────────────
//  4. OTP VERIFICATION EMAIL — sent after registration
// ─────────────────────────────────────────────────────────────────────────────
const sendOtpEmail = async ({ to, userName, otp }) => {
  const subject = `${otp} is your JBAdX verification code`;

  const digits = otp.split('').map(d =>
    `<td style="text-align:center;padding:0 6px;"><span style="display:inline-block;width:44px;height:54px;line-height:54px;background:#0d1117;border:2px solid #f6b73c55;border-radius:10px;font-size:26px;font-weight:800;color:#f6b73c;font-family:monospace;">${d}</span></td>`
  ).join('');

  const body = `
    <h2 style="color:#fff;margin:0 0 8px;">Verify your email address</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hello <strong style="color:#fff;">${userName}</strong>, enter the code below in the app to verify your email address.
      This code expires in <strong style="color:#f6b73c;">15 minutes</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;"><tr>${digits}</tr></table>
    <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 24px;">
      If you did not create a JBAdX account, you can safely ignore this email.
    </p>
    <div style="background:#0d1117;border:1px solid #ffffff10;border-radius:10px;padding:14px 18px;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">⏱ This code is valid for 15 minutes and can only be used once.</p>
    </div>`;

  const html = wrapEmail(
    'Verify Email',
    'linear-gradient(135deg, #1e1b4b, #312e81)',
    '🔐',
    'Email Verification Code',
    body
  );
  await send({ to, subject, html });
};

module.exports = {
  sendWelcomeEmail,
  sendSubmissionConfirmation,
  sendModerationNotification,
  sendOtpEmail,
};
