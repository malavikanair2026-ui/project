const mongoose = require('mongoose');

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
