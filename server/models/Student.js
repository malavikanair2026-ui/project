const mongoose = require('mongoose');

/**
 * Student belongs to Course, Department, and Class (hierarchy).
 * course and department are optional for backward compatibility with existing records.
 */
const studentSchema = new mongoose.Schema(
  {
    student_id: {
      type: Number,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true,
    },
    // Hierarchy: Course → Department → Class
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Please provide class'],
    },
    section: {
      type: String,
      required: [true, 'Please provide section'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Please provide date of birth'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
