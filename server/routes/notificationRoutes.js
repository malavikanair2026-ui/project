const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/notifications - return empty array (no list-all endpoint; use /student/:studentId)
router.get('/', protect, (req, res) => {
  res.json([]);
});

// Get notifications for a student
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    const notifications = await Notification.find({
      recipients: new mongoose.Types.ObjectId(studentId),
    })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error.message);
    console.error(error.stack);
    res.status(500).json({
      message: 'Failed to fetch notifications',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

const VALID_NOTIFICATION_TYPES = ['result', 'announcement', 'feedback', 'general'];

// Create notification (teacher/admin only)
router.post('/', protect, async (req, res) => {
  try {
    const { title, message, recipients, notification_type } = req.body;
    const type =
      notification_type && VALID_NOTIFICATION_TYPES.includes(notification_type)
        ? notification_type
        : 'general';
    const notification = await Notification.create({
      title,
      message,
      sender: req.user._id,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      notification_type: type,
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Notification create error:', error.message);
    console.error(error.stack);
    const message =
      error.name === 'ValidationError'
        ? error.message
        : 'Failed to create notification';
    res.status(500).json({ message });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

module.exports = router;
