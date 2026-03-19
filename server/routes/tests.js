const express = require('express');
const multer = require('multer');
const { parse: csvParse } = require('csv-parse');
const xlsx = require('xlsx');
const { protect, authorize } = require('../middleware/auth');
const Test = require('../models/Test');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    const allowed = ['.csv', '.xlsx'];
    const lower = (file.originalname || '').toLowerCase();
    if (allowed.some((ext) => lower.endsWith(ext))) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv and .xlsx files are allowed'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

const mapQuestionRow = (row) => {
  const text =
    row.text ||
    row.question ||
    row.Question ||
    row['Question Text'] ||
    row['question_text'];

  const optionA = row.optionA || row.A || row.a;
  const optionB = row.optionB || row.B || row.b;
  const optionC = row.optionC || row.C || row.c;
  const optionD = row.optionD || row.D || row.d;
  const correctAnswer =
    row.correctAnswer ||
    row.answer ||
    row.correct ||
    row.CorrectAnswer ||
    row['Correct Answer'];

  if (!text || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
    return null;
  }

  const upperAns = String(correctAnswer).trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(upperAns)) {
    return null;
  }

  return {
    text: String(text).trim(),
    optionA: String(optionA).trim(),
    optionB: String(optionB).trim(),
    optionC: String(optionC).trim(),
    optionD: String(optionD).trim(),
    correctAnswer: upperAns
  };
};

// GET /api/tests - list tests for results UI
// Teacher: returns all tests with effective status (active -> completed when QR expires)
// Student: returns only published tests
// Returns: [{ _id, title, status }]
router.get(
  '/',
  protect,
  authorize('teacher', 'student'),
  async (req, res) => {
    try {
      const now = new Date();
      const role = req.user?.role;

      const query = role === 'student' ? { status: 'published' } : {};

      const tests = await Test.find(query)
        .populate('subjectId', 'name')
        .select('_id title status qrExpiresAt subjectId')
        .sort({ createdAt: -1 });

      // Student should only see published tests for their assigned subjects.
      const assignedSubjectNames = Array.isArray(req.user?.subjects)
        ? req.user.subjects
        : [];

      const mapped = tests
        .filter((t) => {
          if (role !== 'student') return true;
          // If subjectId is missing (old tests), still allow visibility.
          if (!t.subjectId || !t.subjectId.name) return true;
          return assignedSubjectNames.includes(t.subjectId.name);
        })
        .map((t) => {
          let effectiveStatus = t.status;
          // If teacher generated QR and time is over, treat it as completed in the UI
          if (
            t.status === 'active' &&
            t.qrExpiresAt &&
            t.qrExpiresAt instanceof Date &&
            t.qrExpiresAt <= now
          ) {
            effectiveStatus = 'completed';
          }

          return {
            _id: t._id,
            title: t.title,
            status: effectiveStatus,
            subjectName: t.subjectId?.name || ''
          };
        });

      return res.json(mapped);
    } catch (error) {
      console.error('Get tests error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching tests',
        data: {}
      });
    }
  }
);

router.post(
  '/',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const { title, description, durationMinutes, questions, subjectId } =
        req.body || {};

      if (!title || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title and at least one question are required',
          data: {}
        });
      }

      if (!subjectId) {
        return res.status(400).json({
          success: false,
          message: 'subjectId is required',
          data: {}
        });
      }

      const normalized = [];
      for (const q of questions) {
        const mapped = mapQuestionRow(q);
        if (mapped) normalized.push(mapped);
      }

      if (!normalized.length) {
        return res.status(400).json({
          success: false,
          message: 'No valid questions provided',
          data: {}
        });
      }

      const test = await Test.create({
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        subjectId,
        createdBy: req.user._id,
        durationMinutes: Number(durationMinutes || 10),
        questions: normalized,
        status: 'draft'
      });

      return res.json({
        success: true,
        message: 'Test created successfully',
        data: {
          testId: test._id,
          questionCount: test.questions.length
        }
      });
    } catch (error) {
      console.error('Create test error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating test',
        data: {}
      });
    }
  }
);

router.post(
  '/import',
  protect,
  authorize('teacher'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          data: {}
        });
      }

      const { title, description, durationMinutes, testId, subjectId } =
        req.body || {};

      if (!title && !testId) {
        return res.status(400).json({
          success: false,
          message: 'Either title (for new test) or testId (for existing) is required',
          data: {}
        });
      }

      // Subject is mandatory for subject-wise exam setup.
      if (!testId && !subjectId) {
        return res.status(400).json({
          success: false,
          message: 'subjectId is required for creating a new test',
          data: {}
        });
      }

      let rows = [];

      if (req.file.originalname.toLowerCase().endsWith('.csv')) {
        const csvContent = req.file.buffer.toString('utf-8');
        rows = await new Promise((resolve, reject) => {
          csvParse(
            csvContent,
            {
              columns: true,
              skip_empty_lines: true,
              trim: true
            },
            (err, output) => {
              if (err) return reject(err);
              resolve(output || []);
            }
          );
        });
      } else {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = xlsx.utils.sheet_to_json(sheet);
      }

      let valid = [];
      let invalidCount = 0;
      rows.forEach((row) => {
        const mapped = mapQuestionRow(row);
        if (mapped) valid.push(mapped);
        else invalidCount += 1;
      });

      if (!valid.length) {
        return res.status(400).json({
          success: false,
          message: 'No valid questions found in file',
          data: { invalidCount }
        });
      }

      let test;
      if (testId) {
        test = await Test.findOne({
          _id: testId,
          createdBy: req.user._id
        })
          .select('+questions.correctAnswer subjectId');
        if (!test) {
          return res.status(404).json({
            success: false,
            message: 'Test not found',
            data: {}
          });
        }

        // Enforce that appended questions go to the same subject.
        if (subjectId) {
          if (
            test.subjectId &&
            String(test.subjectId) !== String(subjectId)
          ) {
            return res.status(400).json({
              success: false,
              message:
                'Selected subject does not match the existing test subject',
              data: {}
            });
          }

          if (!test.subjectId) {
            test.subjectId = subjectId;
          }
        }
        test.questions.push(...valid);
        await test.save();
      } else {
        test = await Test.create({
          title: String(title).trim(),
          description: description ? String(description).trim() : '',
          createdBy: req.user._id,
          durationMinutes: Number(durationMinutes || 10),
          subjectId,
          questions: valid,
          status: 'draft'
        });
      }

      return res.json({
        success: true,
        message: `Imported ${valid.length} questions. ${invalidCount} invalid rows skipped.`,
        data: {
          testId: test._id,
          questionCount: test.questions.length,
          invalidCount
        }
      });
    } catch (error) {
      console.error('Import test questions error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while importing questions',
        data: {}
      });
    }
  }
);

router.post(
  '/:id/activate',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const test = await Test.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found',
          data: {}
        });
      }
      test.status = 'active';
      await test.save();
      return res.json({
        success: true,
        message: 'Test activated',
        data: { testId: test._id }
      });
    } catch (error) {
      console.error('Activate test error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while activating test',
        data: {}
      });
    }
  }
);

router.post(
  '/:id/publish',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const test = await Test.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found',
          data: {}
        });
      }
      // Publishing is allowed only after completion.
      // We consider a test completed when its QR expiry time has passed.
      if (test.status !== 'completed') {
        const now = new Date();
        const qrExpired =
          test.qrExpiresAt &&
          test.qrExpiresAt instanceof Date &&
          test.qrExpiresAt <= now;

        if (test.status === 'active' && qrExpired) {
          test.status = 'completed';
        } else {
          return res.status(400).json({
            success: false,
            message:
              'Test results cannot be published until the test is completed',
            data: {}
          });
        }
      }

      test.status = 'published';
      await test.save();
      return res.json({
        success: true,
        message: 'Results published',
        data: { testId: test._id }
      });
    } catch (error) {
      console.error('Publish test error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while publishing results',
        data: {}
      });
    }
  }
);

router.post(
  '/:id/qr',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const { expiresInSeconds = 120 } = req.body || {};
      const test = await Test.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found',
          data: {}
        });
      }

      const crypto = require('crypto');
      const token = crypto.randomBytes(16).toString('hex');
      const now = new Date();
      const exp = new Date(now.getTime() + Number(expiresInSeconds) * 1000);

      test.qrToken = token;
      test.qrExpiresAt = exp;
      await test.save();

      return res.json({
        success: true,
        message: 'Exam QR generated',
        data: {
          testId: test._id,
          qrPayload: {
            testId: String(test._id),
            token,
            exp: exp.toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Generate test QR error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating exam QR',
        data: {}
      });
    }
  }
);

module.exports = router;

