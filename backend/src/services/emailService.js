const nodemailer = require('nodemailer');

let cachedTransporter = null;

const hasSmtpConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

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

const sendModerationNotification = async ({ to, userName, adTitle, status, adminMessage }) => {
  const transporter = getTransporter();
  if (!transporter) {
    return;
  }

  const from = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  const isApproved = status === 'approved';
  const statusLabel = isApproved ? 'Approved' : status.charAt(0).toUpperCase() + status.slice(1);
  const actionText = isApproved ? 'approved' : status;

  const subject = `[Advertisement Express] Your ad was ${actionText}`;
  const safeMessage = adminMessage || 'No additional feedback provided by the moderator.';

  const text = [
    `Hello ${userName || 'User'},`,
    '',
    `Your advertisement \"${adTitle}\" has been ${actionText}.`,
    '',
    `Moderator note: ${safeMessage}`,
    '',
    'You can sign in to your dashboard to review the latest status.',
    '',
    'Advertisement Express Team',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Advertisement Update</h2>
      <p>Hello ${userName || 'User'},</p>
      <p>
        Your advertisement <strong>${adTitle}</strong> has been
        <strong>${statusLabel}</strong>.
      </p>
      <p><strong>Moderator note:</strong><br />${safeMessage}</p>
      <p>You can sign in to your dashboard to review the latest status.</p>
      <p style="margin-top: 20px;">Advertisement Express Team</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendModerationNotification,
};
