import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { FaQrcode, FaUsers, FaChartBar, FaCalendarAlt } from 'react-icons/fa';

const DashboardHome = () => {
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayAttendance: 0,
    activeQRCodes: 0,
    totalStudents: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const attendanceResponse = await api.get(`/attendance/daily?date=${today}`);
      const attendanceData = attendanceResponse.data.data;

      const qrResponse = await api.get('/qr/active');
      const activeQRCodes = qrResponse.data.count;

      const studentsResponse = await api.get('/auth/students');
      const totalStudents = studentsResponse.data.count;

      setStats({
        todayAttendance: attendanceData.stats.total,
        activeQRCodes,
        totalStudents,
        recentActivity: attendanceData.attendance.slice(0, 8)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'teacher') {
      fetchDashboardStats();
    }
  }, [authLoading, isAuthenticated, user, fetchDashboardStats]);

  const attendanceRate = useMemo(() => {
    if (!stats.totalStudents) return 0;
    return Math.round((stats.todayAttendance / stats.totalStudents) * 100);
  }, [stats.todayAttendance, stats.totalStudents]);

  const subjectCards = useMemo(() => {
    const summary = stats.recentActivity.reduce((acc, record) => {
      const subject = record.qrCode?.subject || 'N/A';
      if (!acc[subject]) {
        acc[subject] = { total: 0, present: 0 };
      }
      acc[subject].total += 1;
      if (record.status === 'present') acc[subject].present += 1;
      return acc;
    }, {});

    return Object.entries(summary).map(([name, s]) => ({
      name,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
    }));
  }, [stats.recentActivity]);

  const activities = useMemo(
    () =>
      stats.recentActivity.map((record) => ({
        id: record._id,
        text: `${record.student?.name || 'Unknown'} ${
          record.status || ''
        } in ${record.qrCode?.subject || 'N/A'} • ${
          record.qrCode?.course || 'N/A'
        } ${record.qrCode?.semester || ''} • ${new Date(
          record.markedAt
        ).toLocaleTimeString()}`
      })),
    [stats.recentActivity]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const totalStudents = stats.totalStudents;
  const todayCount = stats.todayAttendance;
  const activeQR = stats.activeQRCodes;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header / context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Teacher Dashboard
          </h1>
          <p className="text-sm text-gray-400">
            Welcome back, {user?.name}. Here&apos;s your overview for today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-600 text-slate-200">
            Course: {user?.course || 'N/A'}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-600 text-slate-200">
            Semester: {user?.semester || 'N/A'}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-600 text-slate-200">
            Subjects:{' '}
            {Array.isArray(user?.subjects) && user.subjects.length > 0
              ? user.subjects.join(', ')
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Students" value={totalStudents} />
        <SummaryCard title="Today Attendance" value={todayCount} />
        <SummaryCard title="QR Codes" value={activeQR} />
        <SummaryCard title="Attendance %" value={`${attendanceRate}%`} />
      </div>

      {/* Subject summary + quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Summary */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Subject Summary
          </h2>
          {subjectCards.length === 0 ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            subjectCards.map((sub) => (
              <div key={sub.name} className="mb-3">
                <p className="text-sm text-slate-200">{sub.name}</p>
                <div className="w-full bg-slate-800 h-2 rounded mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded"
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {sub.percentage}% present
                </p>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <ActionCard
              title="Generate QR"
              desc="Create attendance QR for your class"
              onClick={() => navigate('/teacher/qr-generate')}
              icon={<FaQrcode className="text-emerald-400" />}
            />
            <ActionCard
              title="View Attendance"
              desc="Check detailed records"
              onClick={() => navigate('/teacher/attendance')}
              icon={<FaUsers className="text-sky-400" />}
            />
            <ActionCard
              title="Analytics"
              desc="View subject-wise statistics"
              onClick={() => navigate('/teacher/attendance')}
              icon={<FaChartBar className="text-amber-400" />}
            />
            <ActionCard
              title="History"
              desc="Browse past sessions"
              onClick={() => navigate('/teacher/attendance')}
              icon={<FaCalendarAlt className="text-violet-400" />}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Activity
        </h2>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {activities.map((a) => (
              <div
                key={a.id}
                className="py-2 text-sm text-slate-200 flex items-center justify-between"
              >
                <span className="truncate">{a.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value }) => (
  <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl shadow-md">
    <p className="text-gray-400 text-xs md:text-sm">{title}</p>
    <h2 className="text-2xl font-bold mt-2 text-white">{value}</h2>
  </div>
);

const ActionCard = ({ title, desc, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 flex items-start gap-3 transition-colors"
  >
    <div className="mt-1">{icon}</div>
    <div>
      <h3 className="font-medium text-slate-100">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  </button>
);

export default DashboardHome;