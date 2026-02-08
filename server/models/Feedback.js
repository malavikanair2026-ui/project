const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    f_id: {
      type: Number,
      // optional; no unique constraint so multiple feedbacks can be created without f_id
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    feedback: {
      type: String,
      required: [true, 'Please provide feedback'],
      trim: true,
    },
    feedback_type: {
      type: String,
      enum: ['academic', 'behavioral', 'general'],
      default: 'academic',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
