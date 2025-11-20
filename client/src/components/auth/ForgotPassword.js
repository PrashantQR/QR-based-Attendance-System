import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success('Password reset email sent successfully!');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card">
            <div className="card-body p-5 text-center">
              <div className="mb-4">
                <FaEnvelope className="text-primary" style={{ fontSize: '3rem' }} />
              </div>
              <h3 className="fw-bold text-primary mb-3">Check Your Email</h3>
              <p className="text-muted mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-muted small mb-4">
                If you don't see the email, check your spam folder or try again.
              </p>
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => setEmailSent(false)}
              >
                Try Again
              </button>
              <Link to="/login" className="btn btn-primary">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center align-items-center min-vh-100">
      <div className="col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-primary">Forgot Password</h2>
              <p className="text-muted">Enter your email to reset your password</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-decoration-none">
                  <FaArrowLeft className="me-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 