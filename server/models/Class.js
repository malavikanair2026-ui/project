const mongoose = require('mongoose');

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
