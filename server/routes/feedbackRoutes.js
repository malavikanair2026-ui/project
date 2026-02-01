const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

// Get feedback for a student (student can only get own; teacher/admin can get any)
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user?.role);

    if (!isTeacherOrAdmin) {
      const studentRecord = await Student.findOne({ user: req.user._id });
      if (!studentRecord || String(studentRecord._id) !== String(studentId)) {
        return res.status(403).json({ message: 'Not authorized to view this feedback' });
      }
    }

    const feedbacks = await Feedback.find({ student: studentId })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// Create feedback (teacher/admin only)
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { student, feedback, feedback_type } = req.body;
    const feedbackDoc = await Feedback.create({
      teacher: req.user._id,
      student,
      feedback,
      feedback_type: feedback_type || 'academic',
    });
    res.status(201).json(feedbackDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create feedback' });
  }
});

module.exports = router;
