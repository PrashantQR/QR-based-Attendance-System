const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');

const router = express.Router();

const formatPercentageStatus = (percentage) => {
  const p = Number(percentage || 0);
  return p >= 40;
};

// Student: all published attempts for the logged-in student
router.get(
  '/student',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const attempts = await TestAttempt.find({ student: req.user._id })
        .populate({
          path: 'test',
          match: { status: 'published' },
          select: 'title status questions'
        })
        .sort({ submittedAt: -1, createdAt: -1 });

      const results = (attempts || [])
        .filter((a) => a.test)
        .map((a) => {
          const totalQuestions = Array.isArray(a.test.questions)
            ? a.test.questions.length
            : 0;
          return {
            testId: a.test._id,
            testTitle: a.test.title,
            submittedAt: a.submittedAt || a.createdAt,
            score: Number(a.score || 0),
            totalQuestions,
            percentage: Number(a.percentage || 0),
            pass:
              typeof a.pass === 'boolean'
                ? a.pass
                : formatPercentageStatus(a.percentage)
          };
        });

      return res.json({ success: true, data: results });
    } catch (error) {
      console.error('Student results fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching student results',
        data: {}
      });
    }
  }
);

// Teacher: summary for all published tests created by this teacher
router.get(
  '/teacher',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const tests = await Test.find({
        createdBy: req.user._id,
        status: 'published'
      }).select('_id title durationMinutes questions');

      if (!tests.length) {
        return res.json({ success: true, data: [] });
      }

      const testIds = tests.map((t) => t._id);
      const attempts = await TestAttempt.find({
        test: { $in: testIds }
      }).populate('test', 'title questions').populate('student', 'name');

      // Group attempts by test
      const grouped = new Map();
      for (const a of attempts || []) {
        if (!a.test) continue;
        const tid = String(a.test._id);
        if (!grouped.has(tid)) {
          const totalQuestions = Array.isArray(a.test.questions)
            ? a.test.questions.length
            : 0;
          grouped.set(tid, {
            testId: a.test._id,
            testTitle: a.test.title,
            totalStudents: 0,
            avgPercentageSum: 0,
            latestSubmittedAt: null,
            totalQuestions
          });
        }
        const g = grouped.get(tid);
        g.totalStudents += 1;
        g.avgPercentageSum += Number(a.percentage || 0);
        const submitted = a.submittedAt || a.createdAt;
        if (!g.latestSubmittedAt || new Date(submitted) > new Date(g.latestSubmittedAt)) {
          g.latestSubmittedAt = submitted;
        }
      }

      const data = Array.from(grouped.values()).map((g) => {
        const avgPercentage =
          g.totalStudents > 0
            ? Math.round(g.avgPercentageSum / g.totalStudents)
            : 0;
        return {
          testId: g.testId,
          testTitle: g.testTitle,
          totalStudents: g.totalStudents,
          avgPercentage,
          latestSubmittedAt: g.latestSubmittedAt,
          totalQuestions: g.totalQuestions
        };
      });

      data.sort((a, b) => {
        return new Date(b.latestSubmittedAt || 0) - new Date(a.latestSubmittedAt || 0);
      });

      return res.json({ success: true, data });
    } catch (error) {
      console.error('Teacher results summary fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching teacher results',
        data: {}
      });
    }
  }
);

// Teacher: detailed list of student results for a single published test
router.get(
  '/test/:testId',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const { testId } = req.params;

      const test = await Test.findById(testId)
        .populate('subjectId', 'name')
        .select('title status questions subjectId');

      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found',
          data: {}
        });
      }

      if (test.status !== 'published') {
        return res.json({
          success: false,
          message: 'Result not declared',
          data: {}
        });
      }

      const attempts = await TestAttempt.find({ test: test._id })
        .populate('student', 'name')
        .sort({ percentage: -1, submittedAt: -1 });

      const totalQuestions = Array.isArray(test.questions)
        ? test.questions.length
        : 0;

      const students = (attempts || []).map((a) => ({
        studentId: a.student?._id,
        studentName: a.student?.name || 'Unknown',
        score: Number(a.score || 0),
        percentage: Number(a.percentage || 0),
        pass:
          typeof a.pass === 'boolean'
            ? a.pass
            : formatPercentageStatus(a.percentage),
        submittedAt: a.submittedAt || a.createdAt
      }));

      return res.json({
        success: true,
        data: {
          testId: test._id,
          testTitle: test.title,
          subjectName: test.subjectId?.name || '',
          totalQuestions,
          students
        }
      });
    } catch (error) {
      console.error('Teacher test results fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching test results',
        data: {}
      });
    }
  }
);

// Student: detailed list of the student's own attempt for a published test
router.get(
  '/student/test/:testId',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const { testId } = req.params;

      const test = await Test.findById(testId)
        .populate('subjectId', 'name')
        .select('title status questions subjectId +questions.correctAnswer');
      if (!test) {
        return res.status(404).json({ success: false, message: 'Test not found', data: {} });
      }

      if (test.status !== 'published') {
        return res.json({ success: false, message: 'Result not declared', data: {} });
      }

      const attempt = await TestAttempt.findOne({
        test: test._id,
        student: req.user._id
      });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: 'No attempt found for this test',
          data: {}
        });
      }

      const totalQuestions = Array.isArray(test.questions) ? test.questions.length : 0;
      const pass =
        typeof attempt.pass === 'boolean'
          ? attempt.pass
          : formatPercentageStatus(attempt.percentage);

      const selectedMap = new Map(
        (attempt.answers || []).map((a) => [String(a.questionId), a.selected || null])
      );

      const isPublished = test.status === 'published';
      const questions = (test.questions || []).map((q) => {
        const studentAnswer = selectedMap.get(String(q._id)) || null;
        return {
          question: q.text,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          // Security rule: only send correctAnswer when published
          correctAnswer: isPublished ? q.correctAnswer : null,
          studentAnswer
        };
      });

      return res.json({
        success: true,
        data: {
          testId: test._id,
          testTitle: test.title,
          subjectName: test.subjectId?.name || '',
          totalQuestions,
          studentName: req.user.name,
          score: Number(attempt.score || 0),
          percentage: Number(attempt.percentage || 0),
          pass,
          submittedAt: attempt.submittedAt || attempt.createdAt,
          questions
        }
      });
    } catch (error) {
      console.error('Student test result fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching test results',
        data: {}
      });
    }
  }
);

module.exports = router;

