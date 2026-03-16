const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Use local backend in development, env variable / production URL otherwise
  const apiUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : process.env.REACT_APP_API_URL || 'https://qr-based-attendance.onrender.com';
  
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
