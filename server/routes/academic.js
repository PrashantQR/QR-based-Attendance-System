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

module.exports = router;

