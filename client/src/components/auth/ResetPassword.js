import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaLock, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();

  const validateToken = useCallback(async () => {
    try {
      const response = await api.get(`/auth/reset-password/${token}`);
      if (response.data.success) {
        setTokenValid(true);
      }
    } catch (error) {
      setTokenValid(false);
      toast.error('Invalid or expired reset link');
    } finally {
      setValidating(false);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8 text-center"
        >
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-300">Validating reset link...</p>
        </motion.div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8 text-center"
        >
          <h3 className="text-xl font-semibold text-red-400 mb-2">Invalid reset link</h3>
          <p className="text-sm text-gray-300 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center rounded-full bg-accent text-xs font-semibold text-secondary px-4 py-2 hover:bg-emerald-400 transition shadow-soft-glass"
          >
            Request new reset link
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8 text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FaCheck className="text-2xl" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-emerald-300 mb-2">Password reset successfully</h3>
          <p className="text-sm text-gray-300 mb-4">
            Your password has been updated. You will be redirected to login shortly.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-accent text-xs font-semibold text-secondary px-4 py-2 hover:bg-emerald-400 transition shadow-soft-glass"
          >
            Go to login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-white mb-1">Reset password</h2>
          <p className="text-sm text-gray-400">Enter and confirm your new password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-medium text-gray-300">
              New password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
                <FaLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter new password"
                className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-300">
              Confirm new password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
                <FaLock />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm new password"
                className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-gray-200"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full bg-accent text-sm font-semibold text-secondary py-2.5 mt-2 hover:bg-emerald-400 transition shadow-soft-glass disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting password...' : 'Reset password'}
          </button>

          <div className="text-center text-xs text-gray-400 mt-3">
            <Link to="/login" className="hover:text-gray-200">
              Back to login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword; 