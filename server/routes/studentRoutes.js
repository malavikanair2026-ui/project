const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const Feedback = require('../models/Feedback');
const Query = require('../models/Query');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

// Helper: populate student with course, department, class, user
const populateStudent = (q) =>
  q
    .populate('course', 'course_name course_code')
    .populate('department', 'department_name department_code')
    .populate('class', 'class_name')
    .populate('user', 'name email');

// Create student (validates class; optionally course/department for hierarchy)
router.post('/', async (req, res) => {
  try {
    if (req.body.class) {
      const classExists = await Class.findById(req.body.class);
      if (!classExists) {
        return res.status(400).json({ message: 'Class not found' });
      }
    }
    if (req.body.course) {
      const courseExists = await Course.findById(req.body.course);
      if (!courseExists) {
        return res.status(400).json({ message: 'Course not found' });
      }
    }
    if (req.body.department) {
      const deptExists = await Department.findById(req.body.department);
      if (!deptExists) {
        return res.status(400).json({ message: 'Department not found' });
      }
    }

    const student = await Student.create(req.body);
    const populatedStudent = await populateStudent(Student.findById(student._id));
    res.status(201).json(await populatedStudent);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create student' });
  }
});

// Get all students (optionally filter by course, department, class, section)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.course) query.course = req.query.course;
    if (req.query.department) query.department = req.query.department;
    if (req.query.class) query.class = req.query.class;
    if (req.query.section) query.section = req.query.section;

    const students = await Student.find(query)
      .populate('course', 'course_name course_code')
      .populate('department', 'department_name department_code')
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
    if (req.query.section) query.section = req.query.section;

    const students = await Student.find(query)
      .populate('course', 'course_name course_code')
      .populate('department', 'department_name department_code')
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
      .populate('course', 'course_name course_code')
      .populate('department', 'department_name department_code')
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
      .populate('course', 'course_name course_code')
      .populate('department', 'department_name department_code')
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
    if (req.body.class) {
      const classExists = await Class.findById(req.body.class);
      if (!classExists) return res.status(400).json({ message: 'Class not found' });
    }
    if (req.body.course) {
      const courseExists = await Course.findById(req.body.course);
      if (!courseExists) return res.status(400).json({ message: 'Course not found' });
    }
    if (req.body.department) {
      const deptExists = await Department.findById(req.body.department);
      if (!deptExists) return res.status(400).json({ message: 'Department not found' });
    }

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('course', 'course_name course_code')
      .populate('department', 'department_name department_code')
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
