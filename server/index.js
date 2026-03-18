const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load local env file for development only.
// On Render, environment variables (especially PORT) must come from the platform.
const envPath = path.join(__dirname, '..', 'config.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('[boot] loaded env file', envPath);
} else {
  console.log('[boot] skipping env file load');
}

const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');
const attendanceRoutes = require('./routes/attendance');
const evaluationRoutes = require('./routes/evaluation');
const feedbackRoutes = require('./routes/feedback');
const academicRoutes = require('./routes/academic');

const app = express();
app.set('trust proxy', 1);

// Startup log (useful for Render logs)
console.log('[boot] starting server');
console.log('[boot] NODE_ENV =', process.env.NODE_ENV);
console.log('[boot] PORT =', process.env.PORT);
console.log('[boot] cwd =', process.cwd());
console.log('[boot] __dirname =', __dirname);
console.log('[boot] entry =', process.argv[1]);
console.log('[boot] env MONGODB_URI set =', Boolean(process.env.MONGODB_URI));
console.log('[boot] env JWT_SECRET set =', Boolean(process.env.JWT_SECRET));

// Quick sanity checks to catch wrong working directory / wrong deployed root
const expectedFiles = [
  path.join(__dirname, 'routes', 'auth.js'),
  path.join(__dirname, 'routes', 'qr.js'),
  path.join(__dirname, 'routes', 'attendance.js'),
  path.join(__dirname, '..', 'client', 'build', 'index.html')
];
for (const p of expectedFiles) {
  console.log('[boot] exists', p, fs.existsSync(p));
}

process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[fatal] unhandledRejection', err);
  process.exit(1);
});

// Security middleware
app.use(helmet());

// Request logger (helps confirm API is being hit on Render)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// Health check endpoint (register early; should never be shadowed)
app.get('/api/health', (req, res) => {
  console.log('[match] /api/health handler hit');
  res.json({ status: 'OK', message: 'QR Attendance System is running' });
});

// CORS:
// - Same-origin (single Render service serving React + API): Origin will match and be allowed
// - Split deployments (frontend on Vercel, API on Render): set FRONTEND_URL and allow it here
const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    // keep any known deployed origins you use
    'https://qr-based-attendance-system-1-vi94.onrender.com',
    'https://qr-based-attendance-system-sfdt.onrender.com',
    'https://qr-based-attendance-phi.vercel.app'
  ].filter(Boolean)
);

const corsOptions = {
  origin(origin, cb) {
    // allow non-browser clients (curl, Render health checks, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);

    // In case Render generates a new subdomain after redeploy,
    // allow any onrender.com / vercel.app origin. This prevents
    // mobile-only login failures caused by strict CORS.
    try {
      if (origin.endsWith('.onrender.com')) return cb(null, true);
      if (origin.endsWith('.vercel.app')) return cb(null, true);
    } catch (_) {}

    console.log('[cors] blocked origin', origin);
    return cb(null, false);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API marker (lets us confirm API requests reach Express at all)
app.use('/api', (req, res, next) => {
  console.log('[match] /api middleware hit');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api', academicRoutes);

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuildPath));

  // For any non-API route, send back React's index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    console.log('[fallback] react index.html for', req.path);
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  console.log('[api-404] no route matched for', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  console.log('Starting server without database connection...');
  console.log('Please install and start MongoDB to use all features.');
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[boot] server listening on ${PORT}`);
});

server.on('error', (err) => {
  console.error('[fatal] server listen error', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[boot] SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});