const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');

const router = express.Router();

// Create student
router.post('/', async (req, res) => {
  try {
    // Validate that the class exists
    if (req.body.class) {
      const classExists = await Class.findById(req.body.class);
      if (!classExists) {
        return res.status(400).json({ message: 'Class not found' });
      }
    }

    const student = await Student.create(req.body);
    const populatedStudent = await Student.findById(student._id)
      .populate('class', 'class_name')
      .populate('user', 'name email');
    res.status(201).json(populatedStudent);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create student' });
  }
});

// Get all students (optionally filter by class and/or section)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.class) {
      query.class = req.query.class;
    }
    if (req.query.section) {
      query.section = req.query.section;
    }

    const students = await Student.find(query)
      .populate('class', 'class_name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get students by class ID (optionally filter by section)
router.get('/class/:classId', async (req, res) => {
  try {
    const query = { class: req.params.classId };
    if (req.query.section) {
      query.section = req.query.section;
    }

    const students = await Student.find(query)
      .populate('class', 'class_name')
      .populate('user', 'name email')
      .sort({ student_id: 1, name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get student by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.userId })
      .populate('class', 'class_name')
      .populate('user', 'name email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Get student by id
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('class', 'class_name')
      .populate('user', 'name email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    // Validate that the class exists if being updated
    if (req.body.class) {
      const classExists = await Class.findById(req.body.class);
      if (!classExists) {
        return res.status(400).json({ message: 'Class not found' });
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('class', 'class_name')
      .populate('user', 'name email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

module.exports = router;
