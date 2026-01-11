const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide notification title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide notification message'],
      trim: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    is_read: {
      type: Boolean,
      default: false,
    },
    notification_type: {
      type: String,
      enum: ['result', 'announcement', 'feedback', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
