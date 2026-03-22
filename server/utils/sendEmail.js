const nodemailer = require('nodemailer');

function isSmtpConfigured() {
  const pass = (process.env.SMTP_PASSWORD || '').trim();
  const user = (process.env.SMTP_EMAIL || '').trim();
  if (!user || !pass) return false;
  if (pass === 'your-app-password-here' || pass === 'your-app-password') return false;
  const mode = (process.env.SMTP_SERVICE || 'gmail').toLowerCase();
  if (mode === 'smtp' || mode === 'custom') {
    if (!(process.env.SMTP_HOST || '').trim()) return false;
  }
  return true;
}

/**
 * Gmail `service` mode uses nodemailer's well-known settings (often works on Render when raw host:587 times out).
 * Set SMTP_SERVICE=smtp to use SMTP_HOST / SMTP_PORT instead (e.g. non-Gmail providers).
 */
function createTransporter() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  const mode = (process.env.SMTP_SERVICE || 'gmail').toLowerCase();

  if (mode === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  }

  // Custom SMTP (host/port + TLS) — fallback if you need explicit host
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

const sendEmail = async (options) => {
  if (!isSmtpConfigured()) {
    const err = new Error(
      'SMTP is not configured. Set SMTP_EMAIL and SMTP_PASSWORD (e.g. Gmail App Password). Optional: SMTP_SERVICE=gmail (default) or SMTP_SERVICE=smtp with SMTP_HOST.'
    );
    err.code = 'SMTP_NOT_CONFIGURED';
    console.error('[sendEmail]', err.message);
    throw err;
  }

  const mode = (process.env.SMTP_SERVICE || 'gmail').toLowerCase();
  console.log('Email configuration:', {
    smtpService: mode,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_EMAIL,
    fromName: process.env.FROM_NAME,
    fromEmail: process.env.FROM_EMAIL
  });

  const transporter = createTransporter();

  const message = {
    from: `${process.env.FROM_NAME || 'QR Attendance System'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  console.log('Sending email to:', options.email);
  console.log('Email subject:', options.subject);

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ EMAIL ERROR MESSAGE:', error.message);
    console.error('❌ FULL EMAIL ERROR:', error);
    throw error;
  }
};

module.exports = sendEmail;
