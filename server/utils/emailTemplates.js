const getPasswordResetEmailTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - QR Attendance System</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Password Reset</h1>
        <p>QR Attendance System</p>
      </div>
      
      <div class="content">
        <h2>Hello ${userName},</h2>
        
        <p>You recently requested to reset your password for your QR Attendance System account. Click the button below to reset it.</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Your Password</a>
        </div>
        
        <p>This password reset link will expire in <strong>10 minutes</strong>.</p>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>This link is only valid for 10 minutes</li>
            <li>Never share this link with anyone</li>
          </ul>
        </div>
        
        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
        
        <p>If you have any questions, please contact your system administrator.</p>
        
        <p>Best regards,<br>
        QR Attendance System Team</p>
      </div>
      
      <div class="footer">
        <p>This is an automated message, please do not reply to this email.</p>
        <p>&copy; 2024 QR Attendance System. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getPasswordResetEmailTemplate
}; 