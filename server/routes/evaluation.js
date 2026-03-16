const express = require('express');
const Evaluation = require('../models/Evaluation');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper to validate rating 1-5
const isValidRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5;

// @desc    Submit anonymous instructor evaluation
// @route   POST /api/evaluation/submit
// @access  Private (students only)
router.post('/submit', protect, authorize('student'), async (req, res) => {
  try {
    const {
      instructorId,
      course,
      teachingQuality,
      communication,
      interaction,
      subjectKnowledge,
      comment
    } = req.body;

    if (!instructorId || !course) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Instructor and course are required'
      });
    }

    const ratings = {
      teachingQuality: Number(teachingQuality),
      communication: Number(communication),
      interaction: Number(interaction),
      subjectKnowledge: Number(subjectKnowledge)
    };

    for (const [key, value] of Object.entries(ratings)) {
      if (!isValidRating(value)) {
        return res.status(400).json({
          error: 'Validation error',
          message: `${key} must be an integer between 1 and 5`
        });
      }
    }

    // Prevent duplicate evaluations for same student/instructor/course (simple rule)
    const existing = await Evaluation.findOne({
      instructorId,
      studentId: req.user._id,
      course: course.trim()
    }).select('_id');

    if (existing) {
      return res.status(400).json({
        error: 'Duplicate evaluation',
        message: 'You have already submitted an evaluation for this instructor and course'
      });
    }

    await Evaluation.create({
      instructorId,
      studentId: req.user._id,
      course: course.trim(),
      ...ratings,
      comment
    });

    return res.status(201).json({
      success: true,
      message: 'Evaluation submitted successfully'
    });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while submitting evaluation'
    });
  }
});

// @desc    Get evaluation stats for an instructor
// @route   GET /api/evaluation/instructor/:id
// @access  Private (teachers only, and only for themselves)
router.get('/instructor/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const instructorId = req.params.id;

    // Teachers can only view their own evaluations
    if (instructorId !== String(req.user._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own evaluation reports'
      });
    }

    const evaluations = await Evaluation.find({ instructorId }).select(
      'course teachingQuality communication interaction subjectKnowledge comment createdAt'
    );

    if (!evaluations.length) {
      return res.json({
        success: true,
        data: {
          totalEvaluations: 0,
          averages: {
            teachingQuality: 0,
            communication: 0,
            interaction: 0,
            subjectKnowledge: 0
          },
          breakdown: {
            teachingQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            communication: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            interaction: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            subjectKnowledge: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          comments: []
        }
      });
    }

    const totals = {
      teachingQuality: 0,
      communication: 0,
      interaction: 0,
      subjectKnowledge: 0
    };

    const breakdown = {
      teachingQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      communication: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      interaction: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      subjectKnowledge: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    const comments = [];

    evaluations.forEach((evalDoc) => {
      const { teachingQuality, communication, interaction, subjectKnowledge, comment } = evalDoc;

      totals.teachingQuality += teachingQuality;
      totals.communication += communication;
      totals.interaction += interaction;
      totals.subjectKnowledge += subjectKnowledge;

      breakdown.teachingQuality[teachingQuality]++;
      breakdown.communication[communication]++;
      breakdown.interaction[interaction]++;
      breakdown.subjectKnowledge[subjectKnowledge]++;

      if (comment && comment.trim()) {
        comments.push({
          comment: comment.trim(),
          course: evalDoc.course,
          createdAt: evalDoc.createdAt
        });
      }
    });

    const count = evaluations.length;

    const averages = {
      teachingQuality: Number((totals.teachingQuality / count).toFixed(2)),
      communication: Number((totals.communication / count).toFixed(2)),
      interaction: Number((totals.interaction / count).toFixed(2)),
      subjectKnowledge: Number((totals.subjectKnowledge / count).toFixed(2))
    };

    return res.json({
      success: true,
      data: {
        totalEvaluations: count,
        averages,
        breakdown,
        comments
      }
    });
  } catch (error) {
    console.error('Get instructor evaluation error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching evaluations'
    });
  }
});

module.exports = router;

