const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('Email configuration:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_EMAIL,
    fromName: process.env.FROM_NAME,
    fromEmail: process.env.FROM_EMAIL
  });

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL || 'your-email@gmail.com',
      pass: process.env.SMTP_PASSWORD || 'your-app-password'
    }
  });

  // Email options
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
    // Send email
    const info = await transporter.sendMail(message);
    console.log('Message sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = sendEmail; 