const express = require('express');
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const QRCodeModel = require('../models/QRCode');

const router = express.Router();

const getUtcDateRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(dateStr);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

// @desc    Get teacher dashboard stats by subject/date
// @route   GET /api/dashboard?subject=...&date=YYYY-MM-DD
// @access  Private (Teachers only)
router.get('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const subject = (req.query.subject || '').trim();
    const date = req.query.date || new Date().toISOString().split('T')[0];

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required',
        data: {}
      });
    }

    if (
      Array.isArray(req.user.subjects) &&
      req.user.subjects.length > 0 &&
      !req.user.subjects.includes(subject)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only view dashboard for your assigned subjects',
        data: {}
      });
    }

    const studentFilter = {
      role: 'student',
      isActive: true,
      subjects: subject
    };
    if (req.user.course) studentFilter.course = req.user.course;
    if (req.user.semester) studentFilter.semester = req.user.semester;
    if (!req.user.course && !req.user.semester && req.user.department) {
      studentFilter.department = req.user.department;
    }

    const totalStudents = await User.countDocuments(studentFilter);

    const { start, end } = getUtcDateRange(date);
    const qrFilter = {
      generatedBy: teacherId,
      subject,
      generatedAt: { $gte: start, $lte: end }
    };
    const qrDocs = await QRCodeModel.find(qrFilter).select('_id');
    const qrIds = qrDocs.map((q) => q._id);

    const attendanceFilter = {
      teacher: teacherId,
      isDeleted: false,
      date: { $gte: start, $lte: end },
      qrCode: { $in: qrIds }
    };

    const attendanceRecords = await Attendance.find(attendanceFilter)
      .populate('student', 'name')
      .populate('qrCode', 'subject course semester')
      .sort({ createdAt: -1 })
      .limit(5);

    const totalSessions = qrDocs.length;

    const totalAttendance = totalSessions
      ? await Attendance.countDocuments(attendanceFilter)
      : 0;

    const presentAttendance =
      totalSessions && totalStudents
        ? await Attendance.countDocuments({
            ...attendanceFilter,
            status: 'present'
          })
        : 0;

    const absentCount =
      totalSessions && totalStudents && presentAttendance < totalStudents
        ? totalStudents - presentAttendance
        : 0;

    const attendancePercentage =
      totalSessions && totalStudents
        ? Math.round((presentAttendance / totalStudents) * 100)
        : 0;

    const activeQrCount = await QRCodeModel.countDocuments({
      generatedBy: teacherId,
      subject,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    const qrActive = activeQrCount > 0;

    const subjectSummary =
      totalStudents > 0
        ? [
            {
              _id: subject,
              total: totalStudents,
              present: presentAttendance
            }
          ]
        : [];

    return res.json({
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        date,
        subject,
        totalSessions,
        totalStudents,
        totalAttendance,
        presentCount: presentAttendance,
        absentCount,
        attendancePercentage,
        qrActive,
        activeQrCount,
        recentActivity: attendanceRecords,
        subjectSummary
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching dashboard stats',
      data: {}
    });
  }
});

module.exports = router;

