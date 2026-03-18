const express = require('express');
const Evaluation = require('../models/Evaluation');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get aggregated evaluation stats for logged-in teacher
// @route   GET /api/evaluations/stats
// @access  Private (teachers only)
router.get('/stats', protect, authorize('teacher'), async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ instructorId: req.user._id }).select(
      'teachingQuality communication interaction subjectKnowledge doubtSolving'
    );

    const total = evaluations.length;

    const avg = (field) => {
      if (!total) return 0;
      const sum = evaluations.reduce((acc, e) => acc + Number(e[field] || 0), 0);
      return sum / total;
    };

    const stats = {
      teachingQuality: avg('teachingQuality'),
      communication: avg('communication'),
      interaction: avg('interaction'),
      knowledge: avg('subjectKnowledge'),
      doubtSolving: avg('doubtSolving')
    };

    const overall =
      (stats.teachingQuality +
        stats.communication +
        stats.interaction +
        stats.knowledge +
        stats.doubtSolving) /
      5;

    return res.json({
      total,
      stats,
      overall: Number(overall.toFixed(1))
    });
  } catch (error) {
    console.error('Evaluation stats error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching evaluation stats'
    });
  }
});

module.exports = router;

