import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCourseById } from '../services/courseService';
import { submitFeedback, checkFeedbackSubmitted } from '../services/feedbackService';
import StarRating from '../components/StarRating';

const SubmitFeedback = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [form, setForm] = useState({
    rating: 0,
    comment: '',
    anonymous: false,
    teachingQuality: 0,
    courseContent: 0,
    overallSatisfaction: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [courseData, checkData] = await Promise.all([
          getCourseById(courseId),
          checkFeedbackSubmitted(courseId),
        ]);
        setCourse(courseData);
        if (checkData.submitted) {
          setAlreadySubmitted(true);
          toast('You already shared feedback for this course.', { icon: 'ℹ️' });
        }
      } catch (err) {
        toast.error('We could not load the course details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.rating) errs.rating = 'Please select an overall rating';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return toast.error('Please choose an overall rating before submitting.');
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        courseId,
        rating: form.rating,
        comment: form.comment,
        anonymous: form.anonymous,
        teachingQuality: form.teachingQuality || undefined,
        courseContent: form.courseContent || undefined,
        overallSatisfaction: form.overallSatisfaction || undefined,
      });
      toast.success('Thank you. Your feedback has been submitted.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not submit your feedback. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }} className="fade-in">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Feedback Already Submitted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            You have already shared feedback for <strong style={{ color: 'var(--text-secondary)' }}>{course?.courseName}</strong>.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            ← Return to Courses
          </button>
        </div>
      </div>
    );
  }

  const RatingSection = ({ label, field, description }) => (
    <div style={{ marginBottom: '20px' }}>
      <label className="form-label">{label}
        {description && <span style={{ fontWeight: 400, marginLeft: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>({description})</span>}
      </label>
      <StarRating
        rating={form[field]}
        onChange={(val) => {
          setForm((prev) => ({ ...prev, [field]: val }));
          if (field === 'rating' && errors.rating) setErrors((prev) => ({ ...prev, rating: '' }));
        }}
        size={28}
      />
      {field === 'rating' && errors.rating && (
        <p className="form-error" style={{ marginTop: '6px' }}>⚠ {errors.rating}</p>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }} className="fade-in">
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm" style={{ marginBottom: '20px' }}>
        ← Back to Courses
      </button>

      {/* Course Info Header */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.05))' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {course?.courseName}
        </h1>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <span>👤 {course?.facultyName}</span>
          {course?.department && <span>🏛️ {course?.department}</span>}
          {course?.semester && <span>📅 Semester {course?.semester}</span>}
        </div>
      </div>

      {/* Feedback Form */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: '24px' }}>
          <span>⭐ Share Your Feedback</span>
        </h2>

        <form onSubmit={handleSubmit} id="feedback-form">
          {/* Overall Rating - Required */}
          <div style={{ marginBottom: '28px', padding: '20px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 'var(--radius-md)' }}>
            <label className="form-label" style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>
              Overall Rating <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <StarRating
              rating={form.rating}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, rating: val }));
                setErrors((prev) => ({ ...prev, rating: '' }));
              }}
              size={36}
            />
            {errors.rating && <p className="form-error" style={{ marginTop: '8px' }}>⚠ {errors.rating}</p>}
          </div>

          {/* Detailed Ratings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Detailed Ratings <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <RatingSection label="🎤 Teaching Quality" field="teachingQuality" />
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <RatingSection label="📚 Course Content" field="courseContent" />
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <RatingSection label="😊 Satisfaction" field="overallSatisfaction" />
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label" htmlFor="feedback-comment">
              💬 Additional Comments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="feedback-comment"
              className="form-textarea"
              placeholder="Share your experience — what did you love? What could be improved?"
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
              rows={4}
              maxLength={500}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {form.comment.length}/500
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              marginBottom: '24px',
              cursor: 'pointer',
            }}
            onClick={() => setForm((prev) => ({ ...prev, anonymous: !prev.anonymous }))}
            id="anonymous-toggle"
          >
            <div className={`toggle-track ${form.anonymous ? 'active' : ''}`}>
              <div className="toggle-thumb"></div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                🎭 Submit Anonymously
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Your identity will not be shown to faculty or admins
              </div>
            </div>
            {form.anonymous && (
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Active</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="submit-feedback-btn"
            className="btn btn-success btn-full btn-lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner spinner-sm"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitFeedback;
