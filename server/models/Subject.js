const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subject_id: {
      type: Number,
      required: true,
      unique: true,
    },
    subject_name: {
      type: String,
      required: [true, 'Please provide subject name'],
      trim: true,
      unique: true,
    },
    max_marks: {
      type: Number,
      required: [true, 'Please provide maximum marks'],
      default: 100,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
