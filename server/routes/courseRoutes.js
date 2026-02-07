const express = require('express');
const Course = require('../models/Course');
const Department = require('../models/Department');

const router = express.Router();

// Create course
router.post('/', async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create course' });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ course_name: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Get single course by ID (optionally with departments)
router.get('/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.query.include === 'departments') {
      const departments = await Department.find({ course: course._id }).sort({ department_name: 1 });
      return res.json({ ...course.toObject(), departments });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

// Update course
router.put('/:courseId', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update course' });
  }
});

// Delete course (only if no departments reference it)
router.delete('/:courseId', async (req, res) => {
  try {
    const count = await Department.countDocuments({ course: req.params.courseId });
    if (count > 0) {
      return res.status(400).json({
        message: 'Cannot delete course: it has departments. Remove or reassign departments first.',
      });
    }
    const deleted = await Course.findByIdAndDelete(req.params.courseId);
    if (!deleted) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete course' });
  }
});

module.exports = router;
