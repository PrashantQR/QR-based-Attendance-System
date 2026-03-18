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
      instructorId: instructorIdBody,
      teacherId: teacherIdBody,
      course: courseBody,
      subject: subjectBody,
      teachingQuality: teachingQualityBody,
      communication: communicationBody,
      interaction: interactionBody,
      subjectKnowledge: subjectKnowledgeBody,
      doubtSolving: doubtSolvingBody,
      ratings,
      comment
    } = req.body;

    const instructorId = instructorIdBody || teacherIdBody;
    const course = (courseBody || subjectBody) ?? '';

    const teachingQuality = ratings?.teachingQuality ?? teachingQualityBody;
    const communication = ratings?.communication ?? communicationBody;
    const interaction = ratings?.interaction ?? interactionBody;
    const subjectKnowledge =
      ratings?.knowledge ?? ratings?.subjectKnowledge ?? subjectKnowledgeBody;
    const doubtSolving = ratings?.doubtSolving ?? doubtSolvingBody;

    if (!instructorId || !course || !String(course).trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Instructor and subject are required'
      });
    }

    const submittedRatings = {
      teachingQuality: Number(teachingQuality),
      communication: Number(communication),
      interaction: Number(interaction),
      subjectKnowledge: Number(subjectKnowledge),
      doubtSolving: Number(doubtSolving)
    };

    for (const [key, value] of Object.entries(submittedRatings)) {
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
      course: String(course).trim()
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
      course: String(course).trim(),
      ...submittedRatings,
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
      'course teachingQuality communication interaction subjectKnowledge doubtSolving comment createdAt'
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
              subjectKnowledge: 0,
              doubtSolving: 0
          },
          breakdown: {
            teachingQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            communication: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            interaction: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            subjectKnowledge: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            doubtSolving: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          comments: []
        }
      });
    }

    const totals = {
      teachingQuality: 0,
      communication: 0,
      interaction: 0,
      subjectKnowledge: 0,
      doubtSolving: 0
    };

    const breakdown = {
      teachingQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      communication: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      interaction: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      subjectKnowledge: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      doubtSolving: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    const comments = [];

    evaluations.forEach((evalDoc) => {
      const { teachingQuality, communication, interaction, subjectKnowledge, doubtSolving, comment } = evalDoc;

      totals.teachingQuality += Number(teachingQuality || 0);
      totals.communication += Number(communication || 0);
      totals.interaction += Number(interaction || 0);
      totals.subjectKnowledge += Number(subjectKnowledge || 0);
      totals.doubtSolving += Number(doubtSolving || 0);

      if (doubtSolving >= 1 && doubtSolving <= 5) {
        breakdown.doubtSolving[doubtSolving]++;
      }
      if (teachingQuality >= 1 && teachingQuality <= 5) {
        breakdown.teachingQuality[teachingQuality]++;
      }
      if (communication >= 1 && communication <= 5) {
        breakdown.communication[communication]++;
      }
      if (interaction >= 1 && interaction <= 5) {
        breakdown.interaction[interaction]++;
      }
      if (subjectKnowledge >= 1 && subjectKnowledge <= 5) {
        breakdown.subjectKnowledge[subjectKnowledge]++;
      }

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
      subjectKnowledge: Number((totals.subjectKnowledge / count).toFixed(2)),
      doubtSolving: Number((totals.doubtSolving / count).toFixed(2))
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

