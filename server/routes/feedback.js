const express = require('express');
const Evaluation = require('../models/Evaluation');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const calcAverage = (e) => {
  const sum =
    Number(e.teachingQuality) +
    Number(e.communication) +
    Number(e.interaction) +
    Number(e.subjectKnowledge);
  return Number((sum / 4).toFixed(2));
};

// @desc    Get anonymous feedback for an instructor (teacher-only)
// @route   GET /api/feedback/:instructorId
// @access  Private (teachers only, and only for themselves)
router.get('/:instructorId', protect, authorize('teacher'), async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    if (instructorId !== String(req.user._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own feedback'
      });
    }

    const evaluations = await Evaluation.find({ instructorId })
      .select('course teachingQuality communication interaction subjectKnowledge comment createdAt')
      .sort({ createdAt: -1 });

    const feedbacks = evaluations.map((e) => ({
      ratings: {
        teachingQuality: e.teachingQuality,
        communication: e.communication,
        classInteraction: e.interaction,
        subjectKnowledge: e.subjectKnowledge
      },
      course: e.course,
      comment: e.comment || '',
      createdAt: e.createdAt,
      averageRating: calcAverage(e)
    }));

    const overallAverage =
      feedbacks.length === 0
        ? 0
        : Number(
            (
              feedbacks.reduce((acc, f) => acc + Number(f.averageRating || 0), 0) /
              feedbacks.length
            ).toFixed(2)
          );

    return res.json({
      success: true,
      data: {
        total: feedbacks.length,
        overallAverage,
        feedbacks
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching feedback'
    });
  }
});

module.exports = router;

