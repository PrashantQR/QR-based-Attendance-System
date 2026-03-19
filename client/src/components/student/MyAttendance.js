import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const MyAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0
  });
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const enrolledSubjects = Array.isArray(user?.subjects) ? user.subjects : [];
  const filteredAttendance = attendance.filter((record) => {
    if (subjectFilter === 'all') return true;
    return record.qrCode?.subject === subjectFilter;
  });

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching attendance with params:', { startDate, endDate });
      const response = await api.get('/attendance/my-attendance', {
        params: {
          startDate,
          endDate,
          subject: subjectFilter !== 'all' ? subjectFilter : undefined
        }
      });

      console.log('Attendance response:', response.data);
      const payload = response.data.data || {};
      const data = Array.isArray(payload.attendance) ? payload.attendance : [];
      setAttendance(data);

      const apiStats = payload.stats || {};
      setStats({
        totalSessions: apiStats.totalSessions || 0,
        present: apiStats.present || 0,
        absent: apiStats.absent || 0,
        late: apiStats.late || 0,
        attendanceRate: apiStats.attendanceRate || 0
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, subjectFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">My Attendance</h2>
        <p className="text-sm text-gray-400">View your attendance history</p>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-xs font-medium text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-xs font-medium text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="subjectFilter" className="block text-xs font-medium text-gray-300 mb-1">
              Filter by Subject
            </label>
            <select
              id="subjectFilter"
              className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {enrolledSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Sessions" value={stats.totalSessions} />
        <StatCard label="Present" value={stats.present} />
        <StatCard label="Absent" value={stats.absent} />
        <StatCard label="Rate" value={`${stats.attendanceRate}%`} />
      </div>

      <div className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">
            <FaChartBar className="inline mr-2" />
            Attendance History
          </h3>
          <span className="text-xs text-gray-400">{filteredAttendance.length} records</span>
        </div>

        {filteredAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-2 text-left font-medium">Date</th>
                  <th className="py-2 text-left font-medium">Status</th>
                  <th className="py-2 text-left font-medium">Time</th>
                  <th className="py-2 text-left font-medium">Course</th>
                  <th className="py-2 text-left font-medium">Semester</th>
                  <th className="py-2 text-left font-medium">Subject</th>
                  <th className="py-2 text-left font-medium">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAttendance.map((record) => (
                  <tr key={record._id} className="text-gray-200">
                    <td className="py-2 whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
                          record.status === 'present'
                            ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                            : record.status === 'late'
                              ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-200'
                              : 'bg-white/5 border-white/10 text-gray-300'
                        ].join(' ')}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      {new Date(record.markedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2">{record.course || '—'}</td>
                    <td className="py-2">{record.semester || '—'}</td>
                    <td className="py-2">{record.subject || '—'}</td>
                    <td className="py-2">{record.teacher?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center mt-10 text-gray-400 py-10">
            <FaCalendarAlt size={42} className="mx-auto mb-3 opacity-70" />
            <p className="text-sm">No attendance records found for the selected range</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white/5 rounded-2xl p-4 shadow-lg border border-white/10">
    <div className="text-xs text-gray-400 mb-2">{label}</div>
    <div className="text-2xl md:text-3xl font-semibold text-white">{value}</div>
  </div>
);

export default MyAttendance; 