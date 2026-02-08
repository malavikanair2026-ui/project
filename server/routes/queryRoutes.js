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
 * GET /api/queries/teacher/:teacherId
 * Get all queries received by a teacher (addressed to them or general)
 * Must be before /:id/respond so "teacher" is not captured as id.
 */
router.get('/teacher/:teacherId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user.role === 'teacher' && String(req.user._id) !== String(teacherId)) {
      return res.status(403).json({ message: 'Not authorized to view this teacher\'s queries' });
    }

    const queries = await Query.find({
      $or: [
        { teacher: teacherId },
        { teacher: null },
      ],
    })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Don't send student details to teacher (privacy: query content only)
    const sanitized = queries.map((q) => {
      const { student, ...rest } = q;
      return { ...rest, student: undefined };
    });
    res.json(sanitized);
  } catch (error) {
    console.error('Get teacher queries error:', error);
    res.status(500).json({ message: 'Failed to fetch queries' });
  }
});

/**
 * GET /api/queries/student/:studentId
 * Get all queries submitted by a student
 */
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

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

/**
 * GET /api/queries/:id
 * Get a single query by id (teacher/admin or the student who created it).
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const queryDoc = await Query.findById(req.params.id)
      .populate('teacher', 'name email')
      .lean();
    if (!queryDoc) {
      return res.status(404).json({ message: 'Query not found' });
    }
    const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user?.role);
    if (isTeacherOrAdmin) {
      const { student, ...rest } = queryDoc;
      return res.json({ ...rest, student: undefined });
    }
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || String(student._id) !== String(queryDoc.student)) {
        return res.status(403).json({ message: 'Not authorized to view this query' });
      }
    }
    res.json(queryDoc);
  } catch (error) {
    console.error('Get query error:', error);
    res.status(500).json({ message: 'Failed to fetch query' });
  }
});

/**
 * PUT /api/queries/:id/respond
 * Teacher responds to a query (sets response and status to answered)
 * Body: { response: string }
 */
router.put('/:id/respond', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response || typeof response !== 'string' || !response.trim()) {
      return res.status(400).json({ message: 'Response content is required' });
    }

    const queryDoc = await Query.findById(id);
    if (!queryDoc) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Teacher can only respond to queries addressed to them or general (teacher null)
    if (req.user.role === 'teacher') {
      const isAddressedToMe = queryDoc.teacher && String(queryDoc.teacher) === String(req.user._id);
      const isGeneral = !queryDoc.teacher;
      if (!isAddressedToMe && !isGeneral) {
        return res.status(403).json({ message: 'Not authorized to respond to this query' });
      }
    }

    queryDoc.response = response.trim();
    queryDoc.status = 'answered';
    await queryDoc.save();

    const populated = await Query.findById(queryDoc._id)
      .populate('student', 'name student_id')
      .populate('teacher', 'name email');
    res.json(populated);
  } catch (error) {
    console.error('Respond to query error:', error);
    res.status(500).json({ message: 'Failed to respond to query' });
  }
});

/**
 * DELETE /api/queries/:id
 * Delete a student query. Teacher/admin can delete any; student can delete only their own.
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const queryDoc = await Query.findById(req.params.id);
    if (!queryDoc) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user?.role);
    if (isTeacherOrAdmin) {
      await Query.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Query deleted' });
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || String(student._id) !== String(queryDoc.student)) {
        return res.status(403).json({ message: 'Not authorized to delete this query' });
      }
      await Query.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Query deleted' });
    }

    return res.status(403).json({ message: 'Not authorized to delete queries' });
  } catch (error) {
    console.error('Delete query error:', error);
    res.status(500).json({ message: 'Failed to delete query' });
  }
});

module.exports = router;
