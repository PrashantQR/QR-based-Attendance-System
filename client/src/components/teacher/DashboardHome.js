import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const DashboardHome = () => {
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    totalAttendance: 0,
    presentCount: 0,
    absentCount: 0,
    attendancePercentage: 0,
    qrActive: false,
    activeQrCount: 0,
    subjectSummary: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teacherSubjectOptions, setTeacherSubjectOptions] = useState([]);
  const [teacherSubjectsLoading, setTeacherSubjectsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showStudents, setShowStudents] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState('all'); // 'all' | 'present' | 'absent'
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [overallRating, setOverallRating] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [evaluationStats, setEvaluationStats] = useState(null);
  const [evaluationStatsLoading, setEvaluationStatsLoading] = useState(false);
  const [feedbackCourseFilter, setFeedbackCourseFilter] = useState('all');

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    if (!selectedSubject) {
      setLoading(false);
      return;
    }
    try {
      const query = new URLSearchParams({
        subject: selectedSubject,
        date: selectedDate
      }).toString();
      const res = await api.get(`/dashboard?${query}`);
      const data = res.data?.data;

      setStats({
        totalSessions: Number(data?.totalSessions || 0),
        totalStudents: Number(data?.totalStudents || 0),
        totalAttendance: Number(data?.totalAttendance || 0),
        presentCount: Number(data?.presentCount || 0),
        absentCount: Number(data?.absentCount || 0),
        attendancePercentage: Number(data?.attendancePercentage || 0),
        qrActive: Boolean(data?.qrActive),
        activeQrCount: Number(data?.activeQrCount || 0),
        subjectSummary: Array.isArray(data?.subjectSummary) ? data.subjectSummary : [],
        recentActivity: Array.isArray(data?.recentActivity) ? data.recentActivity : []
      });

      // Persist recent activity into localStorage for notifications in navbar
      try {
        const notifications = (data?.recentActivity || []).map((record) => ({
          id: record._id,
          title: `${record.student?.name || 'Unknown'} ${record.status || ''}`.trim(),
          description: `${record.qrCode?.subject || 'N/A'} • ${
            record.qrCode?.course || 'N/A'
          } ${record.qrCode?.semester || ''}`.trim(),
          time: record.markedAt
            ? new Date(record.markedAt).toLocaleTimeString()
            : new Date().toLocaleTimeString()
        }));

        if (notifications.length) {
          localStorage.setItem(
            'qr_notifications',
            JSON.stringify(notifications.slice(0, 10))
          );
        }
      } catch {
        // ignore notification storage errors
      }
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
  }, [logout, navigate, selectedDate, selectedSubject]);

  const fetchActiveQrs = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await api.get('/qr/active');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setQrData(list);
    } catch (error) {
      console.error('Fetch active QR error:', error);
      setQrData([]);
    } finally {
      setQrLoading(false);
    }
  }, []);

  const openQRModal = async () => {
    setShowQRModal(true);
    await fetchActiveQrs();
  };

  useEffect(() => {
    if (!showQRModal) return undefined;
    const interval = setInterval(() => {
      fetchActiveQrs();
    }, 10000);
    return () => clearInterval(interval);
  }, [showQRModal, fetchActiveQrs]);

  const openStudentModal = useCallback(
    async (mode) => {
      if (!selectedSubject || !user?._id) return;
      setStudentModalMode(mode);
      setShowStudents(true);
      setStudentsLoading(true);

      try {
        const params = new URLSearchParams({
          teacherId: String(user._id),
          subject: selectedSubject
        });
        if (user?.course) params.append('course', user.course);
        if (user?.semester) params.append('semester', user.semester);

        const [studentsRes, attendanceRes] = await Promise.all([
          api.get(`/students?${params.toString()}`),
          mode === 'all'
            ? Promise.resolve(null)
            : api.get(
                `/attendance?date=${selectedDate}&subject=${encodeURIComponent(
                  selectedSubject
                )}`
              )
        ]);

        const allStudents = Array.isArray(studentsRes.data?.data)
          ? studentsRes.data.data
          : [];

        if (!attendanceRes || mode === 'all') {
          setStudents(allStudents);
        } else {
          const attendanceList = Array.isArray(
            attendanceRes.data?.data?.attendance
          )
            ? attendanceRes.data.data.attendance
            : [];

          const scannedIds = new Set(
            attendanceList.map((record) =>
              String(record.student?._id || record.student)
            )
          );

          if (mode === 'present') {
            setStudents(
              allStudents.filter((s) => scannedIds.has(String(s._id)))
            );
          } else if (mode === 'absent') {
            setStudents(
              allStudents.filter((s) => !scannedIds.has(String(s._id)))
            );
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard students:', error);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    },
    [selectedSubject, selectedDate, user?._id, user?.course, user?.semester]
  );

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

  const fetchEvaluationStats = useCallback(async () => {
    setEvaluationStatsLoading(true);
    try {
      const res = await api.get('/evaluations/stats');
      const data = res.data;
      setEvaluationStats({
        total: data?.total ?? 0,
        stats: data?.stats ?? {},
        overall: data?.overall ?? 0
      });
    } catch (error) {
      console.error('Error fetching evaluation stats:', error);
      setEvaluationStats(null);
    } finally {
      setEvaluationStatsLoading(false);
    }
  }, []);

  const subjectOptions = useMemo(() => {
    if (Array.isArray(user?.subjects) && user.subjects.length > 0) {
      return user.subjects;
    }
    return teacherSubjectOptions;
  }, [user?.subjects, teacherSubjectOptions]);

  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      if (!user?._id || user?.role !== 'teacher') return;
      if (Array.isArray(user?.subjects) && user.subjects.length > 0) return;

      setTeacherSubjectsLoading(true);
      try {
        const res = await api.get('/teacher/subjects');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setTeacherSubjectOptions(list.map((s) => s.name));
      } catch (error) {
        console.error('Fetch teacher subjects error:', error);
      } finally {
        setTeacherSubjectsLoading(false);
      }
    };

    fetchTeacherSubjects();
  }, [user?._id, user?.role, user?.subjects]);

  useEffect(() => {
    if (user?.role === 'teacher' && !selectedSubject) {
      const firstSubject =
        subjectOptions && subjectOptions.length
          ? subjectOptions[0]
          : '';
      if (firstSubject) setSelectedSubject(firstSubject);
    }
  }, [user?.role, selectedSubject, subjectOptions]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'teacher') {
      fetchDashboardStats();
      fetchFeedback();
      fetchEvaluationStats();
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    fetchDashboardStats,
    fetchFeedback,
    fetchEvaluationStats
  ]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'teacher' && selectedSubject) {
      const interval = setInterval(() => {
        fetchDashboardStats();
      }, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [authLoading, isAuthenticated, user, selectedSubject, fetchDashboardStats]);

  const subjectCards = useMemo(() => {
    return (stats.subjectSummary || []).map((s) => ({
      name: s._id || 'N/A',
      total: Number(s.total || 0),
      present: Number(s.present || 0),
      percentage:
        Number(s.total || 0) > 0
          ? Math.round((Number(s.present || 0) / Number(s.total || 1)) * 100)
          : 0
    }));
  }, [stats.subjectSummary]);

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

  const totalSessions = stats.totalSessions;
  const totalStudents = stats.totalStudents;
  const hasSessions = totalSessions > 0;
  const presentCount = hasSessions ? stats.presentCount : '—';
  const absentCount = hasSessions ? stats.absentCount : '—';
  const activeQR = stats.qrActive ? 'Active' : 'Inactive';
  const activeQrSubtext = stats.qrActive
    ? `Click to view QR (${stats.activeQrCount || 0} active)`
    : `${stats.activeQrCount || 0} active`;
  const latestFeedbacks = feedbacks.slice(0, 5);

  const chartFeedbacks = useMemo(() => {
    if (feedbackCourseFilter === 'all') return feedbacks || [];
    return (feedbacks || []).filter(
      (f) => String(f.course || '') === String(feedbackCourseFilter)
    );
  }, [feedbacks, feedbackCourseFilter]);

  const feedbackCourseOptions = useMemo(() => {
    const set = new Set((feedbacks || []).map((f) => f.course).filter(Boolean));
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [feedbacks]);

  const subjectPerformanceData = useMemo(() => {
    const list = chartFeedbacks || [];
    if (!list.length) return [];

    const map = new Map();
    for (const f of list) {
      const subject = f.course || '';
      if (!subject) continue;

      const prev = map.get(subject) || { sum: 0, count: 0 };
      prev.sum += Number(f.averageRating || 0);
      prev.count += 1;
      map.set(subject, prev);
    }

    return Array.from(map.entries())
      .map(([subject, v]) => ({
        subject,
        rating: Number((v.sum / Math.max(1, v.count)).toFixed(2))
      }))
      .sort((a, b) => (a.rating < b.rating ? 1 : -1));
  }, [chartFeedbacks]);

  const ratingDistributionData = useMemo(() => {
    const list = chartFeedbacks || [];
    const n = list.length || 0;
    if (!n) return [];

    let excellent = 0;
    let average = 0;
    let poor = 0;

    for (const f of list) {
      const r = Number(f.averageRating || 0);
      if (r >= 4) excellent += 1;
      else if (r >= 2) average += 1;
      else poor += 1;
    }

    return [
      { name: 'Excellent (4-5)', value: excellent },
      { name: 'Average (2-3)', value: average },
      { name: 'Poor (0-2)', value: poor }
    ];
  }, [chartFeedbacks]);

  const feedbackTrendData = useMemo(() => {
    const list = chartFeedbacks || [];
    if (!list.length) return [];

    const map = new Map();
    for (const f of list) {
      const d = f.createdAt ? new Date(f.createdAt) : null;
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      const prev = map.get(key) || { sum: 0, count: 0, date: d };
      prev.sum += Number(f.averageRating || 0);
      prev.count += 1;
      map.set(key, prev);
    }

    const arr = Array.from(map.entries())
      .map(([key, v]) => ({
        key,
        label: new Date(key).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short'
        }),
        rating: Number((v.sum / Math.max(1, v.count)).toFixed(2))
      }))
      .sort((a, b) => (a.key < b.key ? -1 : 1));

    // last 7 points
    return arr.slice(-7);
  }, [chartFeedbacks]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const getFeedbackColor = (value) => {
    const v = Number(value || 0);
    if (v >= 4) return 'bg-green-400';
    if (v >= 3) return 'bg-yellow-400';
    return 'bg-rose-400';
  };

  const RatingBar = ({ label, value }) => {
    const v = Number(value || 0);
    const percent = Math.max(0, Math.min(100, (v / 5) * 100));
    const colorClass = getFeedbackColor(v);
    return (
      <div className="mb-1 hover:brightness-125 transition">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>{label}</span>
          <span className="text-white">{v}/5</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-2 rounded transition-all duration-500 ${colorClass}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

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

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
            >
              <option value="">Select Subject</option>
              {subjectOptions && subjectOptions.length ? (
                subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {teacherSubjectsLoading ? 'Loading…' : 'No subjects'}
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Select Date
            </label>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  dateInputRef.current?.showPicker?.() ||
                  dateInputRef.current?.click()
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90 hover:text-white pointer-events-auto"
                aria-label="Open calendar"
                title="Open calendar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {!selectedSubject && (
          <p className="text-sm text-amber-300 mt-3">
            Please select a subject
          </p>
        )}
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title="Total Sessions"
          value={totalSessions}
        />
        <SummaryCard
          title="Total Students"
          value={totalStudents}
          onClick={() => openStudentModal('all')}
        />
        <SummaryCard
          title="Present"
          value={presentCount}
          highlight="success"
          onClick={() => openStudentModal('present')}
        />
        <SummaryCard
          title="Absent"
          value={absentCount}
          highlight="danger"
          onClick={() => openStudentModal('absent')}
        />
        <SummaryCard
          title="QR Status"
          value={activeQR}
          subtext={activeQrSubtext}
          highlight={stats.qrActive ? 'success' : 'muted'}
          onClick={() => {
            if (stats.qrActive) openQRModal();
          }}
        />
        <SummaryCard
          title="Attendance %"
          value={
            hasSessions ? `${stats.attendancePercentage || 0}%` : '—'
          }
        />
      </div>

      {!hasSessions && selectedSubject && (
        <p className="text-sm text-amber-300">
          No session conducted for the selected date and subject.
        </p>
      )}

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
                <p className="text-xs text-gray-400 mt-2">
                  {sub.present} present / {sub.total} total ({sub.percentage}%)
                </p>
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

      {/* Evaluation Insights */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3">
          Evaluation Insights
        </h2>

        {evaluationStatsLoading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : evaluationStats?.total ? (
          <div className="flex flex-col md:flex-row md:items-stretch gap-4">
            {/* Average Rating Card */}
            <div className="md:w-1/3 bg-green-500/15 px-3 py-3 rounded-lg border border-green-500/25 flex flex-col justify-center">
              <div className="text-[11px] text-green-200 uppercase tracking-wide">
                Average Rating
              </div>
              <div className="mt-1 text-2xl font-semibold text-white flex items-baseline gap-1">
                <span>{evaluationStats.overall}</span>
                <span className="text-sm">⭐</span>
              </div>
              <div className="mt-1 text-[11px] text-green-200/80">
                {evaluationStats.total} responses
              </div>
            </div>

            {/* Bar Chart */}
            <div className="md:w-2/3 h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      name: 'Teaching',
                      value: evaluationStats.stats?.teachingQuality ?? 0
                    },
                    {
                      name: 'Comm',
                      value: evaluationStats.stats?.communication ?? 0
                    },
                    {
                      name: 'Interact',
                      value: evaluationStats.stats?.interaction ?? 0
                    },
                    {
                      name: 'Knowledge',
                      value: evaluationStats.stats?.knowledge ?? 0
                    },
                    {
                      name: 'Doubts',
                      value: evaluationStats.stats?.doubtSolving ?? 0
                    }
                  ]}
                >
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={[0, 5]}
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: 8
                    }}
                    formatter={(val) => [`${val}`, 'Avg']}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No feedback available yet</p>
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
            {latestFeedbacks.map((f, idx) => {
              const date = f.createdAt ? new Date(f.createdAt) : null;
              const dateShort = date
                ? date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short'
                  })
                : '';

              return (
                <div
                  key={`${f.createdAt}-${idx}`}
                  className="bg-[#0f172a] p-4 rounded-lg mb-3 text-sm"
                >
                  {/* Top Row */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      ⭐{' '}
                      <span className="font-semibold text-white">
                        {Number(f.averageRating || 0).toFixed(1)}
                      </span>
                    </div>

                    <div className="text-gray-400 text-xs">
                      {f.course ? `${f.course} • ` : ''}
                      {dateShort}
                    </div>
                  </div>

                  {/* Rating Bars */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <RatingBar
                      label="Teaching"
                      value={f.ratings?.teachingQuality ?? 0}
                    />
                    <RatingBar
                      label="Communication"
                      value={f.ratings?.communication ?? 0}
                    />
                    <RatingBar
                      label="Interaction"
                      value={f.ratings?.classInteraction ?? 0}
                    />
                    <RatingBar
                      label="Knowledge"
                      value={f.ratings?.subjectKnowledge ?? 0}
                    />
                    <RatingBar
                      label="Doubt Solving"
                      value={f.ratings?.doubtSolving ?? 0}
                    />
                  </div>

                  {/* Comment */}
                  {f.comment && String(f.comment).trim() && (
                    <p className="text-gray-400 text-xs mt-2 italic">
                      “{String(f.comment).trim()}”
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {feedbacks.length > 0 && (
          <div className="mt-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Analytics</h3>
                <p className="text-xs text-gray-400">
                  Subject-wise performance, rating distribution, and trends
                </p>
              </div>

              <div className="min-w-[240px]">
                <label className="block text-xs text-gray-400 mb-1">
                  Filter by course
                </label>
                <select
                  value={feedbackCourseFilter}
                  onChange={(e) => setFeedbackCourseFilter(e.target.value)}
                  className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                >
                  <option value="all">All Courses</option>
                  {feedbackCourseOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm text-gray-300 mb-2">
                  Subject Performance
                </h4>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformanceData}>
                      <XAxis
                        dataKey="subject"
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        domain={[0, 5]}
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          padding: 8
                        }}
                        formatter={(val) => [`${val}`, 'Avg']}
                      />
                      <Bar
                        dataKey="rating"
                        fill="#22c55e"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm text-gray-300 mb-2">
                  Overall Rating Distribution
                </h4>
                <div className="flex items-center justify-center h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ratingDistributionData}
                        dataKey="value"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        cornerRadius={6}
                      >
                        {ratingDistributionData.map((_, idx) => {
                          const COLORS = [
                            '#22c55e',
                            '#facc15',
                            '#ef4444'
                          ];
                          return (
                            <Cell
                              key={idx}
                              fill={COLORS[idx % COLORS.length]}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm text-gray-300 mb-2">Feedback Trend</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={feedbackTrendData}>
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 5]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: 8
                      }}
                      formatter={(val) => [`${val}`, 'Avg']}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {showStudents && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowStudents(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl bg-slate-900/95 border border-slate-700 rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {studentModalMode === 'present'
                    ? 'Present Students'
                    : studentModalMode === 'absent'
                    ? 'Absent Students'
                    : 'All Students'}{' '}
                  - {selectedSubject || 'N/A'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Showing {students.length} students
                </p>
              </div>
              <button
                className="px-3 py-1 rounded border border-slate-700 text-gray-300 hover:bg-slate-800"
                onClick={() => setShowStudents(false)}
              >
                Close
              </button>
            </div>

            {studentsLoading ? (
              <p className="text-sm text-gray-400">Loading students…</p>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-200">
                  <thead className="bg-slate-800/90">
                    <tr>
                      <Th>Student Name</Th>
                      <Th>Student ID</Th>
                      <Th>Mobile</Th>
                      <Th>Course</Th>
                      <Th>Semester</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr
                        key={s._id}
                        className="border-b border-slate-800 hover:bg-slate-800/60"
                      >
                        <Td>{s.name || 'N/A'}</Td>
                        <Td>{s.studentId || 'N/A'}</Td>
                        <Td>{s.mobileNumber || 'N/A'}</Td>
                        <Td>{s.course || 'N/A'}</Td>
                        <Td>{s.semester || 'N/A'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No students found for selected subject
              </p>
            )}
          </div>
        </div>
      )}

      {showQRModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQRModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl bg-slate-900/95 border border-slate-700 rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Active QR Sessions
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {stats.activeQrCount || qrData.length || 0} active
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="px-3 py-1 rounded border border-slate-700 text-gray-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {qrLoading ? (
              <p className="text-sm text-gray-400">Loading active QR…</p>
            ) : qrData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
                {qrData.map((qr) => {
                  const expiresAt = qr.expiresAt || qr.exp || null;
                  return (
                    <div
                      key={qr._id}
                      className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Subject</p>
                          <p className="text-sm text-gray-200 truncate">
                            {qr.subject || qr.subjectId?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Expiry</p>
                          <p className="text-sm text-gray-200">
                            {expiresAt ? new Date(expiresAt).toLocaleString() : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-300 space-y-1">
                        <p>
                          <span className="text-gray-400">Session Code:</span>{' '}
                          <span className="text-gray-200 break-all">{qr.code}</span>
                        </p>
                        <p>
                          <span className="text-gray-400">Course:</span> {qr.course || '—'}
                        </p>
                        <p>
                          <span className="text-gray-400">Semester:</span> {qr.semester || '—'}
                        </p>
                        <p>
                          <span className="text-gray-400">Location:</span> {qr.location || '—'}
                        </p>
                      </div>

                      <div className="mt-3 flex justify-center">
                        <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                          <QRCodeCanvas
                            value={String(qr.code || '')}
                            size={280}
                            level="H"
                            includeMargin
                            bgColor="#ffffff"
                            fgColor="#000000"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No active QR sessions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, subtext, onClick, highlight }) => {
  const baseClasses =
    'p-4 rounded-xl shadow-md border bg-slate-900/80 border-slate-700';
  const highlightClasses =
    highlight === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/10'
      : highlight === 'danger'
      ? 'border-rose-500/40 bg-rose-500/10'
      : highlight === 'muted'
      ? 'border-slate-600/60 bg-slate-800/60'
      : 'border-slate-700 bg-slate-900/80';

  const clickableClasses = onClick
    ? 'cursor-pointer hover:bg-slate-900 transition'
    : '';

  return (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={`${baseClasses} ${highlightClasses} ${clickableClasses}`}
  >
    <p className="text-gray-400 text-xs md:text-sm">{title}</p>
    <h2 className="text-2xl font-bold mt-2 text-white">{value}</h2>
    {subtext ? <p className="text-xs text-gray-400 mt-1">{subtext}</p> : null}
  </div>
  );
};

const Th = ({ children }) => (
  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="px-3 py-2 align-middle text-xs text-gray-200">{children}</td>
);

export default DashboardHome;