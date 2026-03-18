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
  const [feedbacks, setFeedbacks] = useState([]);
  const [overallRating, setOverallRating] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  const fetchFeedback = useCallback(async () => {
    if (!user?._id) return;
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/feedback/${user._id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = res.data?.data;
      setOverallRating(Number(data?.overallAverage || 0));
      setFeedbacks(Array.isArray(data?.feedbacks) ? data.feedbacks : []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setOverallRating(0);
      setFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'teacher') {
      fetchDashboardStats();
      fetchFeedback();
    }
  }, [authLoading, isAuthenticated, user, fetchDashboardStats, fetchFeedback]);

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
  const latestFeedbacks = feedbacks.slice(0, 5);

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

      {/* Student Feedback */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Student Feedback</h2>
          {feedbackLoading && (
            <span className="text-xs text-gray-400">Loading…</span>
          )}
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">Overall Rating</div>
            <div className="text-sm text-gray-300">{feedbacks.length} feedback</div>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-3xl font-semibold text-white">
              ⭐ {overallRating.toFixed(1)} <span className="text-gray-400 text-base">/ 5</span>
            </div>
            <div className="text-xs text-gray-400">
              Anonymous · latest first
            </div>
          </div>
        </div>

        {latestFeedbacks.length === 0 ? (
          <div className="text-sm text-gray-400">
            No feedback yet.
          </div>
        ) : (
          <div>
            {latestFeedbacks.map((f, idx) => (
              <div key={`${f.createdAt}-${idx}`} className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-100">
                    ⭐ {Number(f.averageRating || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {f.course ? `${f.course} • ` : ''}
                    {f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-gray-200">
                  <div>
                    <div className="text-xs text-gray-400">Teaching</div>
                    <div className="font-semibold">{f.ratings?.teachingQuality ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Communication</div>
                    <div className="font-semibold">{f.ratings?.communication ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Interaction</div>
                    <div className="font-semibold">{f.ratings?.classInteraction ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Knowledge</div>
                    <div className="font-semibold">{f.ratings?.subjectKnowledge ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Doubt Solving</div>
                    <div className="font-semibold">{f.ratings?.doubtSolving ?? '—'}</div>
                  </div>
                </div>

                {f.comment && String(f.comment).trim() && (
                  <div className="mt-3 text-sm text-gray-100">
                    <div className="text-xs text-gray-400 mb-1">Comment</div>
                    <div className="italic">“{String(f.comment).trim()}”</div>
                  </div>
                )}
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