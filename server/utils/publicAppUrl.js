/**
 * Base URL where users open the web app (for links inside emails).
 * Prefer FRONTEND_URL (may include /login); fall back to the incoming request host.
 */
function getPublicAppBaseUrl(req) {
  const fe = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || '').trim();
  if (fe) {
    try {
      const u = new URL(fe);
      return u.origin;
    } catch (_) {
      /* ignore */
    }
  }
  return `${req.protocol}://${req.get('host')}`;
}

module.exports = { getPublicAppBaseUrl };
