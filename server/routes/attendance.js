const express = require('express');
const Attendance = require('../models/Attendance');
const QRCodeModel = require('../models/QRCode');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const getUtcDateRange = (dateStr) => {
  const startOfDay = new Date(dateStr);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(dateStr);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

const getSubjectWiseSummary = async (baseQuery) => {
  const qrCollection = QRCodeModel.collection.name;

  return Attendance.aggregate([
    { $match: baseQuery },
    {
      $lookup: {
        from: qrCollection,
        localField: 'qrCode',
        foreignField: '_id',
        as: 'qr'
      }
    },
    { $unwind: '$qr' },
    {
      $group: {
        _id: '$qr.subject',
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        subject: '$_id',
        total: 1,
        present: 1,
        percentage: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
};

// Fetch teacher attendance for a single date (+ optional subject filter)
const getAttendanceForTeacherDate = async ({ teacherId, dateStr, subject }) => {
  const { startOfDay, endOfDay } = getUtcDateRange(dateStr);

  const qrFilter = {
    generatedBy: teacherId,
    generatedAt: { $gte: startOfDay, $lte: endOfDay }
  };

  if (subject && subject !== 'all') {
    qrFilter.subject = subject;
  }

  const qrCodes = await QRCodeModel.find(qrFilter).select('_id');
  const qrIds = qrCodes.map((q) => q._id);

  const baseQuery = {
    date: { $gte: startOfDay, $lte: endOfDay },
    teacher: teacherId,
    isDeleted: false,
    qrCode: { $in: qrIds }
  };

  const records = await Attendance.find(baseQuery)
    .populate('student', 'name studentId department year mobileNumber')
    .populate(
      'qrCode',
      'code generatedAt expiresAt description course semester subject'
    )
    .sort({ markedAt: 1 });

  const stats = {
    present: 0,
    late: 0,
    absent: 0,
    total: records.length
  };

  for (const r of records) {
    if (r.status === 'present') stats.present += 1;
    else if (r.status === 'late') stats.late += 1;
    else if (r.status === 'absent') stats.absent += 1;
  }

  const subjectSummary = await getSubjectWiseSummary(baseQuery);

  return { attendance: records, stats, subjectSummary, totalSessions: qrCodes.length };
};

// @desc    Get attendance for a date (and optional subject)
// @route   GET /api/attendance?date=YYYY-MM-DD&subject=...
// @access  Private (Teachers only)
router.get('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const subject = req.query.subject;

    const { attendance, stats, subjectSummary, totalSessions } =
      await getAttendanceForTeacherDate({
        teacherId: req.user._id,
        dateStr,
        subject
      });

    return res.json({
      success: true,
      data: {
        date: dateStr,
        attendance,
        stats,
        subjectSummary,
        totalSessions
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching attendance'
    });
  }
});

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
    await attendance.populate(
      'qrCode',
      'code generatedAt expiresAt description course semester subject'
    );
    await attendance.populate('teacher', 'name');

    res.status(201).json({
      success: true,
      message: `Attendance marked successfully as ${status}`,
      data: attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    // Handle race conditions via unique index.
    if (error?.code === 11000) {
      return res.status(400).json({
        error: 'Attendance already marked',
        message: 'You have already marked attendance for this session'
      });
    }
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
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const subject = req.query.subject;

    const { attendance, stats, totalSessions } = await getAttendanceForTeacherDate({
      teacherId: req.user._id,
      dateStr,
      subject
    });

    return res.json({
      success: true,
      data: {
        date: dateStr,
        attendance,
        stats,
        totalSessions
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
      .populate('qrCode', 'code generatedAt description course semester subject')
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

// @desc    Get student's own attendance with session-based stats
// @route   GET /api/attendance/my-attendance
// @access  Private (Students only)
router.get('/my-attendance', protect, authorize('student'), async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Find all QR sessions the student was expected to attend
    const sessionFilter = {
      course: req.user.course,
      semester: req.user.semester,
      generatedAt: { $gte: start, $lte: end }
    };

    if (subject && subject !== 'all') {
      sessionFilter.subject = subject;
    } else if (Array.isArray(req.user.subjects) && req.user.subjects.length > 0) {
      sessionFilter.subject = { $in: req.user.subjects };
    }

    const sessions = await QRCodeModel.find(sessionFilter).select(
      '_id subject course semester generatedAt teacherName'
    );
    const sessionIds = sessions.map((s) => s._id);

    // Attendance records for those sessions
    const attendance = await Attendance.find({
      student: req.user._id,
      qrCode: { $in: sessionIds },
      isDeleted: false,
      date: { $gte: start, $lte: end }
    })
      .populate('qrCode', 'subject course semester generatedBy')
      .populate('teacher', 'name')
      .sort({ date: -1, markedAt: -1 });

    const totalSessions = sessions.length;

    // Sessions where the student scanned (present OR late)
    const scannedSessionIds = new Set(
      attendance.map((a) => String(a.qrCode?._id || a.qrCode))
    );
    const presentSessions = scannedSessionIds.size;

    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const absentSessions =
      totalSessions > presentSessions ? totalSessions - presentSessions : 0;

    const attendanceRate =
      totalSessions > 0
        ? Math.round((presentSessions / totalSessions) * 100)
        : 0;

    // Build subject-wise summary based on sessions (ground truth) + attendance
    const subjectMap = new Map();

    // Initialize per-subject session counts
    for (const s of sessions) {
      const key = s.subject || 'Unknown';
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject: key,
          totalSessions: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0
        });
      }
      const entry = subjectMap.get(key);
      entry.totalSessions += 1;
    }

    // Map sessionId -> subject for quick lookup
    const sessionIdToSubject = new Map(
      sessions.map((s) => [String(s._id), s.subject || 'Unknown'])
    );

    // Track which sessions per subject the student actually attended
    const subjectPresentSessions = new Map();

    for (const a of attendance) {
      const sessionId = String(a.qrCode?._id || a.qrCode);
      const subject = sessionIdToSubject.get(sessionId) || 'Unknown';

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          totalSessions: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0
        });
      }

      const entry = subjectMap.get(subject);

      if (!subjectPresentSessions.has(subject)) {
        subjectPresentSessions.set(subject, new Set());
      }
      const subjectSet = subjectPresentSessions.get(subject);

      if (!subjectSet.has(sessionId)) {
        subjectSet.add(sessionId);
        entry.present += 1;
      }

      if (a.status === 'late') {
        entry.late += 1;
      }
    }

    // Finalize absent + percentage per subject
    for (const entry of subjectMap.values()) {
      const { totalSessions: subTotal, present } = entry;
      const absent =
        subTotal > present ? subTotal - present : 0;
      entry.absent = absent;
      entry.percentage =
        subTotal > 0 ? Math.round((present / subTotal) * 100) : 0;
    }

    const subjectSummary = Array.from(subjectMap.values());

    res.json({
      success: true,
      data: {
        attendance,
        sessions,
        stats: {
          totalSessions,
          present: presentSessions,
          absent: absentSessions,
          late: lateCount,
          attendanceRate
        },
        subjectSummary
      }
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