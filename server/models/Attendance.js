const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    required: [true, 'QR Code ID is required']
  },
  markedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'present'
  },
  location: {
    type: String,
    default: 'Classroom'
  },
  coordinates: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  course: {
    type: String,
    default: 'General'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ qrCode: 1 });
attendanceSchema.index({ teacher: 1, date: 1 });
attendanceSchema.index({ isDeleted: 1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Ensure virtuals are included in JSON output
attendanceSchema.set('toJSON', { virtuals: true });

// Static method to get daily attendance
attendanceSchema.statics.getDailyAttendance = function(date, teacherId) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    teacher: teacherId,
    isDeleted: false
  }).populate('student', 'name studentId department year mobileNumber')
    .populate('qrCode', 'code generatedAt expiresAt description')
    .sort({ markedAt: 1 });
};

// Static method to get student attendance for a date range
attendanceSchema.statics.getStudentAttendance = function(studentId, startDate, endDate) {
  return this.find({
    student: studentId,
    date: { $gte: startDate, $lte: endDate },
    isDeleted: false
  }).populate('qrCode', 'code generatedAt')
    .populate('teacher', 'name')
    .sort({ date: -1 });
};

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = function(teacherId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Convert teacherId to ObjectId if it's a string
  const teacherObjectId = typeof teacherId === 'string' ? new mongoose.Types.ObjectId(teacherId) : teacherId;
  
  return this.aggregate([
    {
      $match: {
        teacher: teacherObjectId,
        date: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema); 