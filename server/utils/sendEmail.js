const nodemailer = require('nodemailer');

function isSmtpConfigured() {
  const pass = (process.env.SMTP_PASSWORD || '').trim();
  const user = (process.env.SMTP_EMAIL || '').trim();
  const host = (process.env.SMTP_HOST || '').trim();
  const portRaw = process.env.SMTP_PORT;
  const port = Number(portRaw);
  if (!user || !pass || !host) return false;
  if (!Number.isFinite(port) || port <= 0) return false;
  if (pass === 'your-app-password-here' || pass === 'your-app-password') return false;
  return true;
}

const sendEmail = async (options) => {
  if (!isSmtpConfigured()) {
    const err = new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_EMAIL, and SMTP_PASSWORD (e.g. Gmail App Password) on the server.'
    );
    err.code = 'SMTP_NOT_CONFIGURED';
    console.error('[sendEmail]', err.message);
    throw err;
  }

  console.log('Email configuration:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_EMAIL,
    fromName: process.env.FROM_NAME,
    fromEmail: process.env.FROM_EMAIL
  });

  // Use env vars from Render / config.env (set SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

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
