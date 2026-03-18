import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import EvaluateInstructor from './EvaluateInstructor';

const DashboardHome = () => {
  const { user } = useAuth();
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [stats, setStats] = useState({
    totalAttendance: 0,
    presentDays: 0,
    lateDays: 0,
    attendanceRate: 0
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const enrolledSubjects = Array.isArray(user?.subjects) ? user.subjects : [];
  const subjectSummary = attendanceRecords.reduce((acc, record) => {
    const subject = record.qrCode?.subject;
    if (!subject || (enrolledSubjects.length > 0 && !enrolledSubjects.includes(subject))) {
      return acc;
    }

    if (!acc[subject]) {
      acc[subject] = { total: 0, present: 0, late: 0 };
    }

    acc[subject].total += 1;
    if (record.status === 'present') acc[subject].present += 1;
    if (record.status === 'late') acc[subject].late += 1;
    return acc;
  }, {});

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
      setAttendanceRecords(attendance);
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

      {/* Subject-wise Attendance */}
      <motion.section
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="bg-secondary/80 border border-white/5 rounded-2.5xl p-5 md:p-6 shadow-soft-glass backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Subject-wise Attendance</h3>
          <span className="text-[11px] text-gray-400">
            {Object.keys(subjectSummary).length} subject{Object.keys(subjectSummary).length === 1 ? '' : 's'}
          </span>
        </div>

        {Object.keys(subjectSummary).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(subjectSummary).map(([subject, summary]) => {
              const rate = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
              return (
                <div
                  key={subject}
                  className="bg-primary/80 border border-white/5 rounded-2.5xl p-4 shadow-soft-glass"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-100">{subject}</h4>
                    <span className="text-xs text-emerald-300 font-semibold">{rate}%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>{summary.present} present / {summary.total} sessions</p>
                    <p>{summary.late} late</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No subject-wise attendance data available yet.</p>
        )}
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
            <InfoRow label="Course" value={user?.course} />
            <InfoRow label="Semester" value={user?.semester} />
            <InfoRow label="Year" value={user?.year} />
            <InfoRow label="Mobile Number" value={user?.mobileNumber} />
          </div>
        </div>
      </motion.section>

      {/* Enrolled Subjects */}
      <motion.section
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-secondary/80 border border-white/5 rounded-2.5xl p-5 md:p-6 shadow-soft-glass backdrop-blur-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-300">Enrolled Subjects</h3>
            <span className="text-[11px] text-gray-400">
              {enrolledSubjects.length} selected
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowEvaluation(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-lg text-white hover:scale-105 transition"
          >
            Instructor Evaluation
          </button>
        </div>

        {enrolledSubjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {enrolledSubjects.map((subject) => (
              <span
                key={subject}
                className="px-3 py-1.5 rounded-full border border-accent/50 bg-accent/10 text-emerald-200 text-xs"
              >
                {subject}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No subjects assigned yet.</p>
        )}
      </motion.section>

      {showEvaluation && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-[#0f172a] p-6 rounded-xl w-full max-w-lg text-white">
            <button
              type="button"
              onClick={() => setShowEvaluation(false)}
              className="mb-4 text-red-400"
            >
              Close
            </button>
            <EvaluateInstructor embedded onClose={() => setShowEvaluation(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

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