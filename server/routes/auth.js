const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { getPublicAppBaseUrl } = require('../utils/publicAppUrl');
const crypto = require('crypto');
const { getPasswordResetEmailTemplate } = require('../utils/emailTemplates');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error('JWT_SECRET is not set');
    err.code = 'MISSING_JWT_SECRET';
    throw err;
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('[/api/auth/register] BODY DATA:', req.body);
    const {
      name,
      email,
      mobileNumber,
      password,
      role,
      studentId,
      department,
      course,
      semester,
      year,
      subjects
    } = req.body;

    // Check if user already exists with email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Check if user already exists with mobile number
    const mobileExists = await User.findOne({ mobileNumber });
    if (mobileExists) {
      return res.status(400).json({
        error: 'Mobile number already exists',
        message: 'A user with this mobile number already exists'
      });
    }

    // Check if student ID already exists (for students)
    if (role === 'student' && studentId) {
      const studentExists = await User.findOne({ studentId });
      if (studentExists) {
        return res.status(400).json({
          error: 'Student ID already exists',
          message: 'A student with this ID already exists'
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      mobileNumber,
      password,
      role,
      studentId,
      department,
      course,
      semester,
      year,
      subjects: Array.isArray(subjects) ? subjects : (subjects ? [subjects] : [])
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
          year: user.year,
          subjects: user.subjects,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        error: 'Invalid user data',
        message: 'Please provide all required fields'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (error && error.code === 'MISSING_JWT_SECRET') {
      return res.status(500).json({
        error: 'Server misconfiguration',
        message: 'Authentication is not configured (JWT_SECRET missing)'
      });
    }
    // Mongoose validation errors should be 400, not 500
    if (error && (error.name === 'ValidationError' || error.code === 11000)) {
      const message =
        error.code === 11000
          ? 'Duplicate field value'
          : Object.values(error.errors || {})
              .map((e) => e.message)
              .filter(Boolean)
              .join(', ') || 'Invalid user data';
      return res.status(400).json({
        error: 'Invalid user data',
        message
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('[/api/auth/login] BODY DATA:', req.body);
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Invalid password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        course: user.course,
        semester: user.semester,
        year: user.year,
        subjects: user.subjects,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error && error.code === 'MISSING_JWT_SECRET') {
      return res.status(500).json({
        error: 'Server misconfiguration',
        message: 'Authentication is not configured (JWT_SECRET missing)'
      });
    }
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login'
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email, mobileNumber, department, year } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check if mobile number is being updated and if it already exists
    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const mobileExists = await User.findOne({ mobileNumber, _id: { $ne: user._id } });
      if (mobileExists) {
        return res.status(400).json({
          error: 'Mobile number already exists',
          message: 'A user with this mobile number already exists'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (department) user.department = department;
    if (year) user.year = year;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while updating profile'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while changing password'
    });
  }
});

// @desc    Get students filtered by course/semester or teacher's department
// @route   GET /api/auth/students
// @access  Private (Teachers only)
router.get('/students', protect, authorize('teacher'), async (req, res) => {
  try {
    const { course, semester } = req.query;

    const filter = {
      role: 'student',
      isActive: true
    };

    if (course) {
      filter.course = course;
    }
    if (semester) {
      filter.semester = semester;
    }

    // Fallback to teacher's department if no academic filter provided
    if (!course && !semester) {
      const teacherDept = req.user.department;
      if (!teacherDept) {
        return res.status(400).json({
          error: 'Missing department',
          message: 'Teacher department is not configured'
        });
      }
      filter.department = teacherDept;
    }

    const students = await User.find(filter).select(
      'name studentId department course semester year email mobileNumber subjects'
    );
    
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching students'
    });
  }
});

// @desc    Get all teachers (for evaluations / selection lists)
// @route   GET /api/auth/teachers
// @access  Private (any authenticated user)
router.get('/teachers', protect, async (req, res) => {
  try {
    const teachers = await User.find({
      role: 'teacher',
      isActive: true
    }).select('name email department');

    res.json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching teachers'
    });
  }
});

// @desc    Get users by role (for quick admin check)
// @route   GET /api/auth/users?role=teacher|student
// @access  Private (Teachers only)
router.get('/users', protect, authorize('teacher'), async (req, res) => {
  try {
    const role = req.query.role === 'teacher' ? 'teacher' : 'student';

    const users = await User.find({
      role,
      isActive: true
    }).select('name email mobileNumber role department year subjects studentId createdAt');

    res.json({
      success: true,
      role,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching users'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with that email address'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Link must open the deployed web app (same host as API on Render, or FRONTEND_URL origin)
    const resetUrl = `${getPublicAppBaseUrl(req)}/reset-password/${resetToken}`;

    const htmlMessage = getPasswordResetEmailTemplate(resetUrl, user.name);

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - QR Attendance System',
        message: `You requested a password reset. Click this link to reset your password: ${resetUrl}`,
        html: htmlMessage
      });

      res.json({
        success: true,
        message: 'Email sent'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      console.error('[forgot-password] sendEmail failed:', err?.code || err?.message, err);

      if (err?.code === 'SMTP_NOT_CONFIGURED') {
        return res.status(503).json({
          error: 'Email service unavailable',
          message:
            'Password reset email is not configured on the server. Ask an admin to set SMTP settings (e.g. on Render: SMTP_EMAIL, SMTP_PASSWORD).'
        });
      }

      return res.status(500).json({
        error: 'Email could not be sent',
        message:
          process.env.NODE_ENV === 'development'
            ? err?.message || 'Email could not be sent'
            : 'Email could not be sent. Check server email (SMTP) settings.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while processing forgot password request'
    });
  }
});

// @desc    Reset password
// @route   GET /api/auth/reset-password/:token
// @access  Public
router.get('/reset-password/:token', async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Password reset token is invalid or has expired'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Reset password validation error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while validating reset token'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while resetting password'
    });
  }
});

module.exports = router; 