const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Use environment variable for API URL in production
  const apiUrl = process.env.REACT_APP_API_URL || 'https://qr-based-attendance.onrender.com';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
      secure: true,
      logLevel: 'debug',
    })
  );
};
