# Email (password reset) — SMTP setup

If you see **“Email could not be sent”** in the app, the API reached the server but **nodemailer could not send mail**.

## Render + Gmail (recommended)

On **Render**, raw `host` + port **587** sometimes hits **`ETIMEDOUT`** (outbound SMTP blocked). This project defaults to **Gmail service mode** in `server/utils/sendEmail.js` — nodemailer uses Gmail’s known endpoints and usually connects reliably.

### Required env vars

| Variable | Example |
|----------|---------|
| `SMTP_EMAIL` | Your Gmail address |
| `SMTP_PASSWORD` | **Gmail App Password** (not your normal login password) |
| `SMTP_SERVICE` | Omit or set `gmail` (default) |
| `FROM_NAME` | `QR Attendance System` |
| `FROM_EMAIL` | Same as `SMTP_EMAIL` usually |

You do **not** need `SMTP_HOST` / `SMTP_PORT` when using the default Gmail service mode.

### Gmail app password

1. Google Account → **Security** → **2-Step Verification** (on).
2. **App passwords** → create an app password for “Mail”.
3. Put that value in **`SMTP_PASSWORD`** on Render.

### Custom SMTP (optional)

Set **`SMTP_SERVICE=smtp`** (or `custom`) and also set **`SMTP_HOST`** (and use **`SMTP_PORT`** if your provider needs something other than the defaults in code).

## Frontend URL in reset emails

Set **`FRONTEND_URL`** to the URL where users open the site (origin is used):

`https://your-app.onrender.com/login`

→ reset links become `https://your-app.onrender.com/reset-password/...`

## After changing env

Redeploy the API service on Render so new variables apply.
