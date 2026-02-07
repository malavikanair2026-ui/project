const express = require('express');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Class = require('../models/Class');

const router = express.Router();

// Create department (validates course exists)
router.post('/', async (req, res) => {
  try {
    if (req.body.course) {
      const courseExists = await Course.findById(req.body.course);
      if (!courseExists) {
        return res.status(400).json({ message: 'Course not found' });
      }
    }
    const department = await Department.create(req.body);
    const populated = await Department.findById(department._id).populate('course', 'course_name course_code');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create department' });
  }
});

// Get all departments (optionally filter by course)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.course) query.course = req.query.course;

    const departments = await Department.find(query)
      .populate('course', 'course_name course_code')
      .sort({ course: 1, department_name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// Get departments by course ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const departments = await Department.find({ course: req.params.courseId })
      .populate('course', 'course_name course_code')
      .sort({ department_name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// Get single department by ID (optionally with classes)
router.get('/:departmentId', async (req, res) => {
  try {
    const department = await Department.findById(req.params.departmentId).populate('course', 'course_name course_code');
    if (!department) return res.status(404).json({ message: 'Department not found' });
    if (req.query.include === 'classes') {
      const classes = await Class.find({ department: department._id }).sort({ class_name: 1 });
      return res.json({ ...department.toObject(), classes });
    }
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch department' });
  }
});

// Update department
router.put('/:departmentId', async (req, res) => {
  try {
    if (req.body.course) {
      const courseExists = await Course.findById(req.body.course);
      if (!courseExists) {
        return res.status(400).json({ message: 'Course not found' });
      }
    }
    const department = await Department.findByIdAndUpdate(req.params.departmentId, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('course', 'course_name course_code');
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update department' });
  }
});

// Delete department (only if no classes reference it)
router.delete('/:departmentId', async (req, res) => {
  try {
    const count = await Class.countDocuments({ department: req.params.departmentId });
    if (count > 0) {
      return res.status(400).json({
        message: 'Cannot delete department: it has classes. Remove or reassign classes first.',
      });
    }
    const deleted = await Department.findByIdAndDelete(req.params.departmentId);
    if (!deleted) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete department' });
  }
});

module.exports = router;
