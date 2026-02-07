const mongoose = require('mongoose');

/**
 * Course entity: top level of hierarchy (e.g., BSc, BCA, BE, MCA).
 * Hierarchy: Course → Department → Class → Student
 */
const courseSchema = new mongoose.Schema(
  {
    course_name: {
      type: String,
      required: [true, 'Please provide course name'],
      trim: true,
    },
    course_code: {
      type: String,
      trim: true,
      uppercase: true,
      // Optional short code (e.g., BSc, BCA). Not unique globally to allow same code across contexts.
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for common lookups
courseSchema.index({ course_name: 1 });

module.exports = mongoose.model('Course', courseSchema);
