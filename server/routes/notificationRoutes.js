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
      .lean();
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Create notification (teacher/admin only)
router.post('/', protect, async (req, res) => {
  try {
    const { title, message, recipients, notification_type } = req.body;
    const notification = await Notification.create({
      title,
      message,
      sender: req.user._id,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      notification_type: notification_type || 'general',
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create notification' });
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
