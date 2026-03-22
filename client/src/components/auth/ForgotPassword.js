import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8 text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FaEnvelope className="text-2xl" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
          <p className="text-sm text-gray-300 mb-3">
            We've sent a password reset link to <span className="font-semibold">{email}</span>
          </p>
          <p className="text-xs text-gray-400 mb-5">
            If you don't see the email, check your spam folder or try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => setEmailSent(false)}
              className="inline-flex items-center justify-center rounded-full border border-white/20 text-xs font-medium text-gray-200 px-4 py-2 hover:bg-white/10 transition"
            >
              Try again
            </button>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-accent text-xs font-semibold text-secondary px-4 py-2 hover:bg-emerald-400 transition shadow-soft-glass"
            >
              Back to Login
            </Link>
          </div>
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
          <h2 className="text-2xl font-semibold text-white mb-1">Forgot password</h2>
          <p className="text-sm text-gray-400">
            Enter your email address and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
                <FaEnvelope />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full bg-accent text-sm font-semibold text-secondary py-2.5 mt-2 hover:bg-emerald-400 transition shadow-soft-glass disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <div className="flex items-center justify-center mt-3 text-xs text-gray-400">
            <FaArrowLeft className="mr-1" />
            <Link to="/login" className="hover:text-gray-200">
              Back to login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 