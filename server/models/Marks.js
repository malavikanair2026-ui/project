const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
  {
    mark_id: {
      type: Number,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    marks_obtained: {
      type: Number,
      required: [true, 'Please provide marks obtained'],
      min: 0,
    },
    exam_type: {
      type: String,
      enum: ['midterm', 'final', 'assignment', 'quiz'],
      default: 'final',
    },
    semester: {
      type: String,
      trim: true,
    },
    is_final: {
      type: Boolean,
      default: false,
    },
    entered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate marks for same student-subject-exam
marksSchema.index({ student: 1, subject: 1, exam_type: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
