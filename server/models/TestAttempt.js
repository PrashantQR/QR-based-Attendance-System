const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selected: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null],
      default: null
    }
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date
    },
    answers: [answerSchema],
    score: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    pass: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Prevent multiple attempts per student per test.
testAttemptSchema.index({ test: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);

