const express = require('express');
const QRCode = require('qrcode');
const QRCodeModel = require('../models/QRCode');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate random QR code
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Generate new QR code
// @route   POST /api/qr/generate
// @access  Private (Teachers only)
router.post('/generate', protect, authorize('teacher'), async (req, res) => {
  try {
    const { description, location, course, validityMinutes = 10 } = req.body;

    // Generate unique QR code
    let code;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      code = generateRandomCode();
      const existingCode = await QRCodeModel.findOne({ code });
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        error: 'Failed to generate unique code',
        message: 'Unable to generate unique QR code after multiple attempts'
      });
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + validityMinutes);

    // Create QR code record
    const qrCode = await QRCodeModel.create({
      code,
      generatedBy: req.user._id,
      expiresAt,
      description: description || 'Daily attendance QR code',
      location: location || 'Classroom',
      course: course || 'General'
    });

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        _id: qrCode._id,
        code: qrCode.code,
        generatedAt: qrCode.generatedAt,
        expiresAt: qrCode.expiresAt,
        description: qrCode.description,
        location: qrCode.location,
        course: qrCode.course,
        qrCodeImage: qrCodeDataURL,
        validityMinutes
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while generating QR code'
    });
  }
});

// @desc    Get active QR codes
// @route   GET /api/qr/active
// @access  Private (Teachers only)
router.get('/active', protect, authorize('teacher'), async (req, res) => {
  try {
    const activeCodes = await QRCodeModel.getActiveCodes();
    
    res.json({
      success: true,
      count: activeCodes.length,
      data: activeCodes
    });
  } catch (error) {
    console.error('Get active QR codes error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching active QR codes'
    });
  }
});

// @desc    Validate QR code (for students)
// @route   POST /api/qr/validate
// @access  Private (Students only)
router.post('/validate', protect, authorize('student'), async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'QR code required',
        message: 'Please provide a QR code'
      });
    }

    // Find the QR code
    const qrCode = await QRCodeModel.findOne({ code }).populate('generatedBy', 'name');
    
    if (!qrCode) {
      return res.status(404).json({
        error: 'Invalid QR code',
        message: 'QR code not found'
      });
    }

    // Check if QR code is active
    if (!qrCode.isActive) {
      return res.status(400).json({
        error: 'QR code expired',
        message: 'This QR code is no longer active'
      });
    }

    // Check if QR code has expired
    if (new Date() > qrCode.expiresAt) {
      return res.status(400).json({
        error: 'QR code expired',
        message: 'This QR code has expired'
      });
    }

    res.json({
      success: true,
      data: {
        _id: qrCode._id,
        code: qrCode.code,
        description: qrCode.description,
        location: qrCode.location,
        course: qrCode.course,
        generatedBy: qrCode.generatedBy,
        expiresAt: qrCode.expiresAt,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Validate QR code error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while validating QR code'
    });
  }
});

// @desc    Get QR code history
// @route   GET /api/qr/history
// @access  Private (Teachers only)
router.get('/history', protect, authorize('teacher'), async (req, res) => {
  try {
    const { page = 1, limit = 10, date } = req.query;
    
    const query = { generatedBy: req.user._id };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.generatedAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const qrCodes = await QRCodeModel.find(query)
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('generatedBy', 'name');

    const total = await QRCodeModel.countDocuments(query);

    res.json({
      success: true,
      data: qrCodes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get QR history error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching QR history'
    });
  }
});

// @desc    Deactivate QR code
// @route   PUT /api/qr/:id/deactivate
// @access  Private (Teachers only)
router.put('/:id/deactivate', protect, authorize('teacher'), async (req, res) => {
  try {
    const qrCode = await QRCodeModel.findOne({
      _id: req.params.id,
      generatedBy: req.user._id
    });

    if (!qrCode) {
      return res.status(404).json({
        error: 'QR code not found',
        message: 'QR code not found or you are not authorized'
      });
    }

    qrCode.isActive = false;
    await qrCode.save();

    res.json({
      success: true,
      message: 'QR code deactivated successfully',
      data: qrCode
    });
  } catch (error) {
    console.error('Deactivate QR code error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while deactivating QR code'
    });
  }
});

// @desc    Clean up expired QR codes (cron job endpoint)
// @route   POST /api/qr/cleanup
// @access  Private (System only)
router.post('/cleanup', async (req, res) => {
  try {
    const result = await QRCodeModel.deactivateExpired();
    
    res.json({
      success: true,
      message: 'Expired QR codes cleaned up',
      data: result
    });
  } catch (error) {
    console.error('Cleanup QR codes error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during cleanup'
    });
  }
});

module.exports = router; 