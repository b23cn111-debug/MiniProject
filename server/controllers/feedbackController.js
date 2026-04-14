const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Course = require('../models/Course');

// @desc    Submit feedback for a course
// @route   POST /api/feedback
// @access  Private (student)
const submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { courseId, rating, comment, anonymous, teachingQuality, courseContent, overallSatisfaction } = req.body;

  try {
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check for duplicate submission (enforced by DB index too)
    const existingFeedback = await Feedback.findOne({
      studentId: req.user._id,
      courseId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: 'You have already submitted feedback for this course',
      });
    }

    const feedback = await Feedback.create({
      studentId: req.user._id,
      courseId,
      rating,
      comment: comment || '',
      anonymous: anonymous || false,
      teachingQuality,
      courseContent,
      overallSatisfaction,
    });

    const populated = await Feedback.findById(feedback._id).populate('courseId', 'courseName facultyName');

    res.status(201).json({
      message: 'Feedback submitted successfully!',
      feedback: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted feedback for this course' });
    }
    console.error('Submit feedback error:', error.message);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
};

// @desc    Get feedback for a student (their own) / all for admin
// @route   GET /api/feedback
// @access  Private
const getFeedback = async (req, res) => {
  try {
    const { courseId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role === 'admin') {
      // Admin sees all
      if (courseId) query.courseId = courseId;
    } else {
      // Student sees only their own
      query.studentId = req.user._id;
      if (courseId) query.courseId = courseId;
    }

    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('courseId', 'courseName facultyName department')
      .populate({
        path: 'studentId',
        select: 'name email',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mask student name if anonymous (for admins viewing anonymous submissions)
    const sanitized = feedbacks.map((fb) => {
      const fbObj = fb.toObject();
      if (fbObj.anonymous && req.user.role === 'admin') {
        fbObj.studentId = { name: 'Anonymous', email: '***' };
      }
      return fbObj;
    });

    res.json({
      feedbacks: sanitized,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get feedback error:', error.message);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
};

// @desc    Get all feedback (admin analytics)
// @route   GET /api/feedback/analytics
// @access  Admin
const getFeedbackAnalytics = async (req, res) => {
  try {
    // Average rating per course
    const courseAnalytics = await Feedback.aggregate([
      {
        $group: {
          _id: '$courseId',
          avgRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
          avgTeachingQuality: { $avg: '$teachingQuality' },
          avgCourseContent: { $avg: '$courseContent' },
          avgOverallSatisfaction: { $avg: '$overallSatisfaction' },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          courseName: '$course.courseName',
          facultyName: '$course.facultyName',
          department: '$course.department',
          avgRating: { $round: ['$avgRating', 1] },
          totalFeedbacks: 1,
          avgTeachingQuality: { $round: ['$avgTeachingQuality', 1] },
          avgCourseContent: { $round: ['$avgCourseContent', 1] },
          avgOverallSatisfaction: { $round: ['$avgOverallSatisfaction', 1] },
        },
      },
      { $sort: { avgRating: -1 } },
    ]);

    // Rating distribution (1-5)
    const ratingDist = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Total stats
    const totalFeedbacks = await Feedback.countDocuments();
    const overallAvg = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    // Feedback over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const feedbackTrend = await Feedback.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalFeedbacks,
      overallAvgRating: overallAvg[0] ? Math.round(overallAvg[0].avg * 10) / 10 : 0,
      courseAnalytics,
      ratingDistribution: ratingDist,
      feedbackTrend,
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// @desc    Delete feedback (admin only)
// @route   DELETE /api/feedback/:id
// @access  Admin
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error.message);
    res.status(500).json({ message: 'Server error deleting feedback' });
  }
};

// @desc    Check if student has submitted feedback for a course
// @route   GET /api/feedback/check/:courseId
// @access  Private (student)
const checkFeedbackSubmitted = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      studentId: req.user._id,
      courseId: req.params.courseId,
    });
    res.json({ submitted: !!feedback, feedback: feedback || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error checking feedback' });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackAnalytics,
  deleteFeedback,
  checkFeedbackSubmitted,
};
