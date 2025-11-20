const express = require('express');
const Attendance = require('../models/Attendance');
const QRCodeModel = require('../models/QRCode');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Mark attendance (for students)
// @route   POST /api/attendance/mark
// @access  Private (Students only)
router.post('/mark', protect, authorize('student'), async (req, res) => {
  try {
    const { qrCodeId, coordinates } = req.body;

    if (!qrCodeId) {
      return res.status(400).json({
        error: 'QR code ID required',
        message: 'Please provide a QR code ID'
      });
    }

    // Find the QR code
    const qrCode = await QRCodeModel.findById(qrCodeId);
    
    if (!qrCode) {
      return res.status(404).json({
        error: 'QR code not found',
        message: 'Invalid QR code'
      });
    }

    // Check if QR code is still valid
    if (!qrCode.isValid()) {
      return res.status(400).json({
        error: 'QR code expired',
        message: 'This QR code has expired or is no longer active'
      });
    }

    // Check if student has already marked attendance for this QR code
    const existingAttendance = await Attendance.findOne({
      student: req.user._id,
      qrCode: qrCodeId,
      isDeleted: false
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: 'Attendance already marked',
        message: 'You have already marked attendance for this session'
      });
    }

    // Determine if student is late (after 5 minutes of QR generation)
    const fiveMinutesAfter = new Date(qrCode.generatedAt);
    fiveMinutesAfter.setMinutes(fiveMinutesAfter.getMinutes() + 5);
    
    const status = new Date() > fiveMinutesAfter ? 'late' : 'present';

    // Create attendance record
    const attendance = await Attendance.create({
      student: req.user._id,
      qrCode: qrCodeId,
      teacher: qrCode.generatedBy,
      status,
      location: qrCode.location,
      course: qrCode.course,
      coordinates: coordinates || { latitude: null, longitude: null }
    });

    // Populate the attendance record
    await attendance.populate('qrCode', 'code generatedAt expiresAt');
    await attendance.populate('teacher', 'name');

    res.status(201).json({
      success: true,
      message: `Attendance marked successfully as ${status}`,
      data: attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while marking attendance'
    });
  }
});

// @desc    Get daily attendance (for teachers)
// @route   GET /api/attendance/daily
// @access  Private (Teachers only)
router.get('/daily', protect, authorize('teacher'), async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const attendance = await Attendance.getDailyAttendance(date, req.user._id);
    const stats = await Attendance.getAttendanceStats(req.user._id, date);

    // Convert stats to object
    const statsObj = {};
    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        date,
        attendance,
        stats: {
          present: statsObj.present || 0,
          late: statsObj.late || 0,
          absent: statsObj.absent || 0,
          total: attendance.length
        }
      }
    });
  } catch (error) {
    console.error('Get daily attendance error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching daily attendance'
    });
  }
});

// @desc    Get attendance by date range
// @route   GET /api/attendance/range
// @access  Private (Teachers only)
router.get('/range', protect, authorize('teacher'), async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Date range required',
        message: 'Please provide start and end dates'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: start, $lte: end },
      teacher: req.user._id,
      isDeleted: false
    };

    if (studentId) {
      query.student = studentId;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name studentId department year mobileNumber')
      .populate('qrCode', 'code generatedAt description')
      .sort({ date: -1, markedAt: 1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get attendance range error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching attendance range'
    });
  }
});

// @desc    Get student's own attendance
// @route   GET /api/attendance/my-attendance
// @access  Private (Students only)
router.get('/my-attendance', protect, authorize('student'), async (req, res) => {
  try {
    console.log('My attendance request received');
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    console.log('Date range:', { start, end });

    const attendance = await Attendance.getStudentAttendance(
      req.user._id,
      start,
      end
    );

    console.log('Attendance found:', attendance.length, 'records');

    res.json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching your attendance'
    });
  }
});

// @desc    Delete attendance entry (for teachers)
// @route   DELETE /api/attendance/:id
// @access  Private (Teachers only)
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      _id: req.params.id,
      teacher: req.user._id,
      isDeleted: false
    });

    if (!attendance) {
      return res.status(404).json({
        error: 'Attendance not found',
        message: 'Attendance record not found or you are not authorized'
      });
    }

    // Soft delete
    attendance.isDeleted = true;
    attendance.deletedBy = req.user._id;
    attendance.deletedAt = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while deleting attendance'
    });
  }
});

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (Teachers only)
router.get('/stats', protect, authorize('teacher'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const stats = await Attendance.aggregate([
      {
        $match: {
          teacher: req.user._id,
          date: { $gte: startDate, $lte: now },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        stats
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching attendance statistics'
    });
  }
});

// @desc    Export attendance to CSV
// @route   GET /api/attendance/export
// @access  Private (Teachers only)
router.get('/export', protect, authorize('teacher'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Date range required',
        message: 'Please provide start and end dates'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end },
      teacher: req.user._id,
      isDeleted: false
    }).populate('student', 'name studentId department year mobileNumber')
      .populate('qrCode', 'code generatedAt description')
      .sort({ date: 1, markedAt: 1 });

    // Convert to CSV format
    const csvData = attendance.map(record => ({
      Date: record.date.toISOString().split('T')[0],
      'Student Name': record.student.name,
      'Student ID': record.student.studentId,
      Department: record.student.department,
      Year: record.student.year,
      'Mobile Number': record.student.mobileNumber,
      Status: record.status,
      'Marked At': record.markedAt.toISOString(),
      Location: record.location,
      Course: record.course
    }));

    res.json({
      success: true,
      data: csvData,
      filename: `attendance_${startDate}_to_${endDate}.csv`
    });
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while exporting attendance'
    });
  }
});

module.exports = router; 