const mongoose = require('mongoose');

const gradingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a schema name'],
      trim: true,
      unique: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    grade_ranges: [
      {
        grade: {
          type: String,
          required: true,
          enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
        },
        min_percentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        max_percentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        grade_point: {
          type: Number,
          required: true,
          min: 0,
          max: 10,
        },
      },
    ],
    pass_percentage: {
      type: Number,
      required: true,
      default: 33,
      min: 0,
      max: 100,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one active schema exists
gradingSchema.pre('save', async function (next) {
  if (this.is_active && (this.isNew || this.isModified('is_active'))) {
    await mongoose.model('GradingSchema').updateMany(
      { _id: { $ne: this._id }, is_active: true },
      { is_active: false }
    );
  }
  next();
});

module.exports = mongoose.model('GradingSchema', gradingSchema);
