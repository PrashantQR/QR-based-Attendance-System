import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { FaQrcode, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAttendance: 0,
    presentDays: 0,
    lateDays: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentStats();
  }, []);

  const fetchStudentStats = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const response = await api.get('/attendance/my-attendance', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });

      const attendance = response.data.data;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      const totalCount = attendance.length;

      setStats({
        totalAttendance: totalCount,
        presentDays: presentCount,
        lateDays: lateCount,
        attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">Student Dashboard</h2>
        <p className="text-sm text-gray-400">Welcome back, {user?.name}!</p>
      </div>

      {/* Quick Actions */}
      <motion.section
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-secondary/70 border border-white/5 rounded-2.5xl p-4 md:p-6 shadow-soft-glass backdrop-blur-xl"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            to="/student/scan"
            icon={<FaQrcode className="text-accent" size={32} />}
            title="Scan QR Code"
            description="Mark your attendance"
          />
          <QuickActionCard
            to="/student/my-attendance"
            icon={<FaCalendarAlt className="text-emerald-400" size={32} />}
            title="My Attendance"
            description="View your attendance history"
          />
          <QuickActionCard
            to="/profile"
            icon={<FaUser className="text-sky-400" size={32} />}
            title="Profile"
            description="Update your profile"
          />
          <QuickActionCard
            to="/student/evaluate-instructor"
            icon={<FaUser className="text-yellow-400" size={32} />}
            title="Instructor Evaluation"
            description="Submit anonymous feedback"
          />
        </div>
      </motion.section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={stats.totalAttendance} />
        <StatCard label="Present Days" value={stats.presentDays} />
        <StatCard label="Late Days" value={stats.lateDays} />
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} />
      </section>

      {/* Student Info */}
      <motion.section
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-secondary/80 border border-white/5 rounded-2.5xl p-5 md:p-6 shadow-soft-glass backdrop-blur-xl"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-200">
          <div className="space-y-1.5">
            <InfoRow label="Name" value={user?.name} />
            <InfoRow label="Student ID" value={user?.studentId} />
            <InfoRow label="Email" value={user?.email} />
          </div>
          <div className="space-y-1.5">
            <InfoRow label="Department" value={user?.department} />
            <InfoRow label="Year" value={user?.year} />
            <InfoRow label="Mobile Number" value={user?.mobileNumber} />
          </div>
        </div>
      </motion.section>
    </div>
  );
};

const QuickActionCard = ({ to, icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -2 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    className="group"
  >
    <Link
      to={to}
      className="block bg-primary/80 border border-white/5 rounded-2.5xl px-4 py-5 h-full shadow-soft-glass hover:bg-primary/90 transition-colors duration-200"
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/40">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-100 mb-1">{title}</h4>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  </motion.div>
);

const StatCard = ({ label, value }) => (
  <motion.div
    whileHover={{ scale: 1.04, y: -2 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    className="bg-gradient-to-br from-emerald-500/80 via-emerald-600/80 to-emerald-700/80 rounded-2.5xl p-4 shadow-soft-glass"
  >
    <div className="text-xs text-emerald-100/80 mb-2">{label}</div>
    <div className="text-2xl md:text-3xl font-semibold text-white">{value}</div>
  </motion.div>
);

const InfoRow = ({ label, value }) => (
  <p>
    <span className="font-semibold text-gray-300 mr-1.5">{label}:</span>
    <span className="text-gray-200">{value ?? '—'}</span>
  </p>
);

export default DashboardHome; 