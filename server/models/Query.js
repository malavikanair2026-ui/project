const mongoose = require('mongoose');

/**
 * Query Model - Student-to-Teacher queries
 * This is a separate collection from Feedback (which is teacher-to-student).
 * No modifications to existing models; uses MongoDB's default _id.
 */
const querySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Optional - null for general queries not targeted at specific teacher
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    query: {
      type: String,
      required: [true, 'Query content is required'],
      trim: true,
    },
    response: {
      type: String,
      trim: true,
      default: null, // Teacher's reply when they respond
    },
    status: {
      type: String,
      enum: ['pending', 'answered'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Query', querySchema);
