const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    // Detailed ratings breakdown (optional)
    teachingQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    courseContent: {
      type: Number,
      min: 1,
      max: 5,
    },
    overallSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate submissions per student per course
feedbackSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
