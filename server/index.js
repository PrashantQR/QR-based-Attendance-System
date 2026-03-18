const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');
const attendanceRoutes = require('./routes/attendance');
const evaluationRoutes = require('./routes/evaluation');
const academicRoutes = require('./routes/academic');

const app = express();
app.set('trust proxy', 1);

// Startup log (useful for Render logs)
console.log('[boot] starting server');
console.log('[boot] NODE_ENV =', process.env.NODE_ENV);
console.log('[boot] PORT =', process.env.PORT);

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

// CORS configuration to allow frontend origins and let the library
// handle allowed methods/headers for preflight correctly
const allowedOrigins = [
  'http://localhost:3000',
  'https://qr-based-attendance-phi.vercel.app',
  'https://qr-based-attendance-system-1-vi94.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Explicitly handle preflight for all routes with same config
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api', academicRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'QR Attendance System is running' });
});

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuildPath));

  // For any non-API route, send back React's index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
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
app.listen(PORT, () => {
  console.log(`[boot] server listening on ${PORT}`);
}); 