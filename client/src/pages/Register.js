import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const InputField = ({ id, label, type = 'text', placeholder, field, formData, errors, onChange }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    <input
      type={type}
      id={id}
      name={field}
      className="form-input"
      placeholder={placeholder}
      value={formData[field]}
      onChange={onChange}
      style={errors[field] ? { borderColor: 'var(--error)' } : {}}
    />
    {errors[field] && <p className="form-error">⚠ {errors[field]}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!formData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password || formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      const userData = await registerService(payload);
      login(userData);
      toast.success(`Your account is ready. Welcome, ${userData.name}.`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'We could not create your account. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">✨</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Create your student account in less than a minute.</p>
        </div>

        <form onSubmit={handleSubmit} id="register-form" noValidate>
          <InputField id="reg-name" label="Full Name" placeholder="John Doe" field="name" formData={formData} errors={errors} onChange={handleChange} />
          <InputField id="reg-email" label="Email Address" type="email" placeholder="john@college.edu" field="email" formData={formData} errors={errors} onChange={handleChange} />
          <InputField id="reg-password" label="Password" type="password" placeholder="Min. 6 characters" field="password" formData={formData} errors={errors} onChange={handleChange} />
          <InputField id="reg-confirm" label="Confirm Password" type="password" placeholder="Repeat your password" field="confirmPassword" formData={formData} errors={errors} onChange={handleChange} />

          <button
            type="submit"
            id="register-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: '20px' }}>
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
