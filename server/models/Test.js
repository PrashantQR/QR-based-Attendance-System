const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    optionA: { type: String, required: true, trim: true },
    optionB: { type: String, required: true, trim: true },
    optionC: { type: String, required: true, trim: true },
    optionD: { type: String, required: true, trim: true },
    // Hidden by default so we never leak keys unless explicitly selected.
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
      select: false
    }
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    // Subject-wise exams: teacher links each test to a Subject document.
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'published'],
      default: 'draft'
    },
    durationMinutes: { type: Number, default: 10, min: 1, max: 180 },
    questions: [questionSchema],
    // QR-based entry
    qrToken: { type: String },
    qrExpiresAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);

