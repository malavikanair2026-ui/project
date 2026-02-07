const mongoose = require('mongoose');

/**
 * Department entity: belongs to a Course (e.g., CSE, ECE, IT under BE).
 * Hierarchy: Course → Department → Class → Student
 */
const departmentSchema = new mongoose.Schema(
  {
    department_name: {
      type: String,
      required: [true, 'Please provide department name'],
      trim: true,
    },
    department_code: {
      type: String,
      trim: true,
      uppercase: true,
      // Optional short code (e.g., CSE, ECE)
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Please provide course for department'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering departments by course
departmentSchema.index({ course: 1 });
departmentSchema.index({ course: 1, department_name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
