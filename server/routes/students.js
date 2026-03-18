const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get registered students for teacher (optionally filtered by subject/course/semester)
// @route   GET /api/students?teacherId=xxx&subject=xxx&course=xxx&semester=xxx
// @access  Private (Teachers only)
router.get('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherIdParam = req.query.teacherId;
    if (
      teacherIdParam &&
      String(teacherIdParam) !== String(req.user._id)
    ) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own students'
      });
    }

    const subject = req.query.subject;
    const course = req.query.course || req.user.course;
    const semester = req.query.semester || req.user.semester;

    const filter = {
      role: 'student',
      isActive: true
    };

    if (course) filter.course = course;
    if (semester) filter.semester = semester;

    // Fallback: if teacher doesn't have course/semester configured,
    // use department so the list is not empty.
    if (!course && !semester && req.user.department) {
      filter.department = req.user.department;
    }

    if (subject && subject !== 'all') {
      filter.subjects = subject;
    }

    const students = await User.find(filter).select(
      'name studentId course semester mobileNumber department year'
    );

    return res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching students'
    });
  }
});

module.exports = router;

