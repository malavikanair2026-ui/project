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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Class', classSchema);
