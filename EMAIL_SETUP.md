# Email Setup for Password Reset Functionality

This guide will help you configure email settings for the password reset feature in the QR Attendance System.

## Prerequisites

1. A Gmail account (or other email provider)
2. App password for your email account

## Gmail Setup

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security
3. Under "2-Step Verification", click on "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "QR Attendance System" as the name
6. Click "Generate"
7. Copy the 16-character password

### Step 3: Update Configuration
Update your `config.env` file with your email credentials:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
FROM_NAME=QR Attendance System
FROM_EMAIL=your-email@gmail.com
```

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_EMAIL=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_EMAIL=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

## Testing Email Configuration

1. Start your server
2. Go to the login page
3. Click "Forgot your password?"
4. Enter your email address
5. Check your email for the reset link

## Security Notes

- Never commit your email credentials to version control
- Use environment variables for sensitive information
- Consider using a dedicated email service like SendGrid for production
- Regularly rotate your app passwords

## Troubleshooting

### Common Issues

1. **Authentication failed**: Check your app password
2. **Connection timeout**: Verify SMTP host and port
3. **Email not received**: Check spam folder
4. **Invalid credentials**: Ensure 2FA is enabled and app password is correct

### Debug Mode

To enable email debugging, add this to your `config.env`:

```env
EMAIL_DEBUG=true
```

This will log email sending attempts to the console.

## Production Recommendations

For production environments, consider using:

1. **SendGrid**: Professional email service
2. **Mailgun**: Reliable email delivery
3. **AWS SES**: Cost-effective for high volume

Update the SMTP configuration accordingly for your chosen service. 