const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Stored but never exposed to teachers; select:false keeps it out of queries by default
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  teachingQuality: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  interaction: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  subjectKnowledge: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);

