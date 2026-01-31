const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

/**
 * POST /api/queries
 * Create a new query (student submits to teacher)
 * Student identity is derived from req.user - no client-supplied studentId to prevent spoofing
 * Body: { teacher?: ObjectId, subject?: string, query: string }
 */
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const { teacher, subject, query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Query content is required' });
    }

    const queryDoc = await Query.create({
      student: student._id,
      teacher: teacher || null,
      subject: (subject && subject.trim()) || '',
      query: query.trim(),
    });

    const populated = await Query.findById(queryDoc._id)
      .populate('student', 'name')
      .populate('teacher', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create query error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to create query' });
  }
});

/**
 * GET /api/queries/student/:studentId
 * Get all queries submitted by a student
 * Authorization: student can only fetch their own; teachers/admin/principal/staff can fetch any
 */
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Students can only fetch their own queries
    if (req.user.role === 'student') {
      if (String(student.user) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to view this student\'s queries' });
      }
    }

    const queries = await Query.find({ student: studentId })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    console.error('Get queries error:', error);
    res.status(500).json({ message: 'Failed to fetch queries' });
  }
});

module.exports = router;
