import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="space-y-6">
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

      {/* Subject summary */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Subject Summary
        </h2>
        {subjectCards.length === 0 ? (
          <p className="text-sm text-gray-400">No data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectCards.map((sub) => (
              <div key={sub.name} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-200">{sub.name}</p>
                  <span className="text-xs text-emerald-300 font-semibold">{sub.percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded"
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">{sub.percentage}% present</p>
              </div>
            ))}
          </div>
        )}
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

export default DashboardHome;