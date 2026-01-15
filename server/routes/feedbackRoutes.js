const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');

// Get feedback for a student
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ student: req.params.studentId })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// Create feedback (teacher/admin only)
router.post('/', protect, async (req, res) => {
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
