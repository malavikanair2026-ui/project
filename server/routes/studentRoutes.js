const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const Feedback = require('../models/Feedback');
const Query = require('../models/Query');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

// Create student
router.post('/', async (req, res) => {
  try {
    // Resolve class: accept ObjectId or class name
    let classId = req.body.class;
    if (classId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(classId);
      if (isObjectId) {
        const classExists = await Class.findById(classId);
        if (!classExists) {
          return res.status(400).json({ message: 'Class not found' });
        }
      } else {
        const nameTrimmed = String(classId).trim();
        const escaped = nameTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let byName = await Class.findOne({
          class_name: { $regex: new RegExp(`^${escaped}$`, 'i') },
        });
        // If class "cs" is requested but doesn't exist, create it so Add Student works
        if (!byName && /^cs$/i.test(nameTrimmed)) {
          const maxClass = await Class.findOne().sort({ class_id: -1 }).select('class_id').lean();
          const nextClassId = (maxClass?.class_id ?? 0) + 1;
          byName = await Class.create({
            class_id: nextClassId,
            class_name: 'CS',
          });
        }
        if (!byName) {
          return res.status(400).json({ message: `Class "${classId}" not found. Please select a class from the list.` });
        }
        classId = byName._id;
      }
    }
    const body = { ...req.body, class: classId };

    const student = await Student.create(body);
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

// Delete student and all related data (marks, results, feedback, queries, notifications, user)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = student._id;
    const userId = student.user; // ObjectId from non-populated doc

    // Delete all marks for this student
    await Marks.deleteMany({ student: studentId });

    // Delete all results for this student
    await Result.deleteMany({ student: studentId });

    // Delete all feedback for this student
    await Feedback.deleteMany({ student: studentId });

    // Delete all queries by this student
    await Query.deleteMany({ student: studentId });

    // Remove student from notification recipients
    await Notification.updateMany(
      { recipients: studentId },
      { $pull: { recipients: studentId } }
    );

    // Delete the student record first
    await Student.findByIdAndDelete(studentId);

    // Delete the associated user account (optional - don't fail if user already deleted)
    if (userId) {
      try {
        await User.findByIdAndDelete(userId);
      } catch (userErr) {
        // Student and related data already deleted; log but don't fail
        console.warn('Could not delete user for student:', userErr.message);
      }
    }

    res.json({ message: 'Student and all related data deleted' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({
      message: err.message || 'Failed to delete student',
    });
  }
});

module.exports = router;
