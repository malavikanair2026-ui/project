const mongoose = require('mongoose');

/**
 * Class entity: belongs to a Department (e.g., CSE-A, CSE-B).
 * Hierarchy: Course → Department → Class → Student
 * department is optional for backward compatibility with existing classes.
 */
const classSchema = new mongoose.Schema(
  {
    class_id: {
      type: Number,
      required: true,
      unique: true,
    },
    class_name: {
      type: String,
      required: [true, 'Please provide class name'],
      trim: true,
      unique: true,
    },
    // Department under which this class falls. Optional for backward compatibility.
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    subjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    class_teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigned_teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    semesters: [
      {
        semester_name: {
          type: String,
          required: true,
          trim: true,
        },
        start_date: {
          type: Date,
        },
        end_date: {
          type: Date,
        },
        is_active: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Class', classSchema);
