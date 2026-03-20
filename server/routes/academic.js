const express = require('express');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Create course (teacher only)
router.post('/courses', protect, authorize('teacher'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required' });
    }

    const normalizedName = name.trim();
    const existing = await Course.findOne({ name: normalizedName });
    if (existing) {
      return res.status(400).json({ error: 'Course already exists' });
    }

    const course = await Course.create({
      name: normalizedName,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all courses (public)
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ name: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create subject (teacher only)
router.post('/subjects', protect, authorize('teacher'), async (req, res) => {
  try {
    const { name, course, semester } = req.body;
    if (!name || !name.trim() || !course || !semester) {
      return res.status(400).json({ error: 'Name, course and semester are required' });
    }

    const normalizedName = name.trim();
    const existing = await Subject.findOne({
      name: normalizedName,
      course,
      semester
    });

    if (existing) {
      return res.status(400).json({ error: 'Subject already exists for this course/semester' });
    }

    const subject = await Subject.create({
      name: normalizedName,
      course,
      semester,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get subjects available for this teacher (for subject-wise exam setup)
// Route: GET /api/teacher/subjects
router.get(
  '/teacher/subjects',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      console.log('[teacher/subjects] Teacher ID:', req.user?._id);
      const assignedNames = Array.isArray(req.user.subjects)
        ? req.user.subjects
        : [];

      console.log('[teacher/subjects] User.subjects:', assignedNames);

      let subjects = [];

      // 1) Prefer subjects created/owned by this teacher
      // (works even when User.subjects is empty)
      subjects = await Subject.find({
        $or: [
          { createdBy: req.user._id },
          // compatibility if someone used teacherId field
          { teacherId: req.user._id }
        ]
      })
        .select('_id name course semester createdBy teacherId')
        .sort({ name: 1 });

      // 2) If User.subjects names exist, intersect/extend by those names too
      if (assignedNames.length) {
        const byName = await Subject.find({
          name: { $in: assignedNames }
        })
          .select('_id name course semester createdBy teacherId')
          .sort({ name: 1 });

        const map = new Map();
        for (const s of [...subjects, ...byName]) {
          map.set(String(s._id), s);
        }
        subjects = Array.from(map.values());
      }

      // 3) Fallback: if DB has no Subject docs for this teacher at all,
      // auto-provision based on teacher.subjects (stored as names in User).
      // This prevents empty dropdowns when teachers selected "standard"
      // subjects during registration but Subject documents weren't created.
      if (subjects.length === 0 && assignedNames.length > 0) {
        const teacherCourse = req.user.course;
        const teacherSemester = req.user.semester;

        // Only auto-create when we have enough info.
        if (teacherCourse && teacherSemester) {
          const created = await Promise.all(
            assignedNames.map(async (subjectName) => {
              const normalizedName = String(subjectName || '').trim();
              if (!normalizedName) return null;

              const doc = await Subject.findOneAndUpdate(
                { name: normalizedName, course: teacherCourse, semester: teacherSemester },
                { $setOnInsert: { createdBy: req.user._id } },
                { upsert: true, new: true }
              );

              return doc;
            })
          );

          subjects = created.filter(Boolean);
        }
      }

      // 4) Ensure stable output
      subjects = subjects.map((s) => ({
        _id: s._id,
        name: s.name,
        course: s.course,
        semester: s.semester
      }));

      return res.json({ success: true, data: subjects });
    } catch (error) {
      console.error('Get teacher subjects error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        data: {}
      });
    }
  }
);

// Get subjects filtered by course & semester (public)
router.get('/subjects', async (req, res) => {
  try {
    const { course, semester } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (semester) filter.semester = semester;

    const subjects = await Subject.find(filter).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Student can suggest a new subject (optional)
router.post('/subjects/student', protect, authorize('student'), async (req, res) => {
  try {
    const { name, course, semester } = req.body;
    if (!name || !name.trim() || !course || !semester) {
      return res.status(400).json({ error: 'Name, course and semester are required' });
    }

    const normalizedName = name.trim();
    const existing = await Subject.findOne({ name: normalizedName, course, semester });
    if (existing) {
      return res.status(400).json({ error: 'Subject already exists for this course/semester' });
    }

    const subject = await Subject.create({
      name: normalizedName,
      course,
      semester,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    console.error('Create student subject error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

