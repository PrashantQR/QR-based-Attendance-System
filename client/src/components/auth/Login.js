import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        console.log('Login successful, navigating to root...');
        console.log('User data:', result.user);
        // Let App route based on role from the root path
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400">Sign in to your account</p>
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-medium text-gray-300">
              Password
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
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full bg-accent text-sm font-semibold text-secondary py-2.5 mt-2 hover:bg-emerald-400 transition shadow-soft-glass disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center text-xs text-gray-400 mt-3 space-y-1">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-300 hover:text-emerald-200 font-semibold">
                Sign up here
              </Link>
            </p>
            <p>
              <Link
                to="/forgot-password"
                className="text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
              >
                Forgot your password?
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login; 