const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');

const router = express.Router();

router.post(
  '/start',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const { testId, token } = req.body || {};

      if (!testId || !token) {
        return res.status(400).json({
          success: false,
          message: 'testId and token are required',
          data: {}
        });
      }

      const test = await Test.findById(testId)
        .populate('subjectId', 'name')
        .select('+questions.correctAnswer');

      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found',
          data: {}
        });
      }

      const now = new Date();

      if (
        !test.qrToken ||
        !test.qrExpiresAt ||
        test.qrToken !== token ||
        test.qrExpiresAt <= now
      ) {
        return res.status(400).json({
          success: false,
          message: 'QR session is invalid or expired',
          data: {}
        });
      }

      if (test.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Test is not active',
          data: {}
        });
      }

      // Subject-wise protection: students can only start exams for their subjects.
      if (test.subjectId && test.subjectId.name) {
        const allowed = Array.isArray(req.user.subjects)
          ? req.user.subjects.includes(test.subjectId.name)
          : false;
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: 'You are not allowed to start this test for your subjects',
            data: {}
          });
        }
      }

      const existing = await TestAttempt.findOne({
        test: test._id,
        student: req.user._id
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already started or completed this test',
          data: {}
        });
      }

      const answers = (test.questions || []).map((q) => ({
        questionId: q._id,
        selected: null
      }));

      const attempt = await TestAttempt.create({
        test: test._id,
        student: req.user._id,
        startedAt: now,
        answers
      });

      const safeQuestions = (test.questions || []).map((q) => ({
        _id: q._id,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD
      }));

      return res.json({
        success: true,
        message: 'Exam started',
        data: {
          testId: test._id,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          startedAt: attempt.startedAt,
          questions: safeQuestions
        }
      });
    } catch (error) {
      console.error('Exam start error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while starting the exam',
        data: {}
      });
    }
  }
);

router.post(
  '/submit',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const { testId, answers } = req.body || {};

      if (!testId || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: 'testId and answers are required',
          data: {}
        });
      }

      const attempt = await TestAttempt.findOne({
        test: testId,
        student: req.user._id
      });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: 'No active attempt found for this test',
          data: {}
        });
      }

      if (attempt.submittedAt) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this test',
          data: {}
        });
      }

      const test = await Test.findById(testId).select(
        '+questions.correctAnswer'
      );

      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found',
          data: {}
        });
      }

      const answerMap = new Map(
        (answers || []).map((a) => [
          String(a.questionId),
          a.selected ? String(a.selected).toUpperCase() : null
        ])
      );

      let score = 0;
      const totalQuestions = (test.questions || []).length;

      for (const q of test.questions || []) {
        const key = String(q._id);
        const selected = answerMap.get(key);
        const isCorrect =
          selected && selected === q.correctAnswer;
        if (isCorrect) score += 1;
      }

      const percentage =
        totalQuestions > 0
          ? Math.round((score / totalQuestions) * 100)
          : 0;

      const pass = percentage >= 40;

      attempt.answers = attempt.answers.map((a) => {
        const selected = answerMap.get(String(a.questionId)) || null;
        return { ...a.toObject(), selected };
      });
      attempt.score = score;
      attempt.percentage = percentage;
      attempt.pass = pass;
      attempt.submittedAt = new Date();
      await attempt.save();

      return res.json({
        success: true,
        message: 'Test submitted successfully',
        data: {
          score,
          percentage,
          pass
        }
      });
    } catch (error) {
      console.error('Exam submit error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while submitting the exam',
        data: {}
      });
    }
  }
);

router.get(
  '/result/:testId',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const { testId } = req.params;

      const test = await Test.findById(testId).select(
        '+questions.correctAnswer'
      );

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

      const selectedMap = new Map(
        attempt.answers.map((a) => [
          String(a.questionId),
          a.selected || null
        ])
      );

      const questions = (test.questions || []).map((q) => ({
        questionId: q._id,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        selected: selectedMap.get(String(q._id)) || null
      }));

      return res.json({
        success: true,
        message: 'Result available',
        data: {
          score: attempt.score,
          percentage: attempt.percentage,
          pass: attempt.pass,
          questions
        }
      });
    } catch (error) {
      console.error('Exam result error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching result',
        data: {}
      });
    }
  }
);

module.exports = router;

