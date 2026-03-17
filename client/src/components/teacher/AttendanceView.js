import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceView = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');

  const subjectSummary = useMemo(
    () =>
      attendance.reduce((acc, record) => {
        const subject = record.qrCode?.subject || 'N/A';
        if (!acc[subject]) {
          acc[subject] = { total: 0, present: 0, late: 0 };
        }
        acc[subject].total += 1;
        if (record.status === 'present') acc[subject].present += 1;
        if (record.status === 'late') acc[subject].late += 1;
        return acc;
      }, {}),
    [attendance]
  );

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((record) => {
        if (subjectFilter === 'all') return true;
        return record.qrCode?.subject === subjectFilter;
      }),
    [attendance, subjectFilter]
  );

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/daily?date=${selectedDate}`);
      setAttendance(response.data.data.attendance);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const deleteAttendance = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this attendance record?'
      )
    ) {
      try {
        await api.delete(`/attendance/${id}`);
        toast.success('Attendance record deleted successfully');
        fetchAttendance();
      } catch (error) {
        console.error('Error deleting attendance:', error);
        toast.error('Failed to delete attendance record');
      }
    }
  };

  const attendanceRate =
    stats.total > 0
      ? Math.round(((stats.present || 0) / stats.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Attendance View
          </h1>
          <p className="text-sm text-gray-400">
            View and manage attendance records
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

      {/* Controls and summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Date & subject filter */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
            <label
              htmlFor="date"
              className="block text-xs font-semibold text-gray-400 mb-2"
            >
              <span className="inline-flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                Select Date
              </span>
            </label>
            <input
              type="date"
              id="date"
              className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
            <label
              htmlFor="subjectFilter"
              className="block text-xs font-semibold text-gray-400 mb-2"
            >
              Filter by Subject
            </label>
            <select
              id="subjectFilter"
              className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {Array.isArray(user?.subjects) &&
                user.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
          <SummaryCard title="Total Students" value={stats.total || 0} />
          <SummaryCard title="Present" value={stats.present || 0} />
          <SummaryCard title="Late" value={stats.late || 0} />
          <SummaryCard title="Attendance Rate" value={`${attendanceRate}%`} />
        </div>
      </div>

      {/* Attendance table */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">
            Attendance Records
          </h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg border border-sky-500 text-sky-400 text-xs font-medium flex items-center gap-1 hover:bg-sky-500/10"
              onClick={() => window.print()}
            >
              <FaEye className="text-xs" />
              Print
            </button>
            <button
              className="px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-400 text-xs font-medium flex items-center gap-1 hover:bg-emerald-500/10"
              onClick={() => {
                toast.info('Export feature coming soon!');
              }}
            >
              <FaDownload className="text-xs" />
              Export
            </button>
          </div>
        </div>

        {filteredAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-slate-800/90">
                <tr>
                  <Th>Student Name</Th>
                  <Th>Student ID</Th>
                  <Th>Department</Th>
                  <Th>Course</Th>
                  <Th>Semester</Th>
                  <Th>Subject</Th>
                  <Th>Year</Th>
                  <Th>Mobile</Th>
                  <Th>Status</Th>
                  <Th>Time</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-slate-800 hover:bg-slate-800/60"
                  >
                    <Td>
                      <span className="font-semibold">
                        {record.student.name}
                      </span>
                    </Td>
                    <Td>{record.student.studentId}</Td>
                    <Td>{record.student.department}</Td>
                    <Td>{record.qrCode?.course || 'N/A'}</Td>
                    <Td>{record.qrCode?.semester || 'N/A'}</Td>
                    <Td>{record.qrCode?.subject || 'N/A'}</Td>
                    <Td>{record.student.year}</Td>
                    <Td>{record.student.mobileNumber}</Td>
                    <Td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          record.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : record.status === 'late'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {record.status}
                      </span>
                    </Td>
                    <Td>
                      {new Date(record.markedAt).toLocaleTimeString()}
                    </Td>
                    <Td>
                      <button
                        className="px-2 py-1 rounded border border-rose-500 text-rose-400 text-xs hover:bg-rose-500/10"
                        onClick={() => deleteAttendance(record._id)}
                        title="Delete record"
                      >
                        <FaTrash />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
            <FaCalendarAlt size={40} className="mb-3 text-gray-500" />
            <p>No attendance records found for this date</p>
          </div>
        )}
      </div>

      {/* Subject-wise Summary */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Subject-wise Summary
        </h2>
        {Object.keys(subjectSummary).length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(subjectSummary).map(([subject, summary]) => (
              <div
                key={subject}
                className="bg-slate-950/70 border border-slate-700 rounded-xl p-4"
              >
                <p className="text-sm text-slate-100 mb-1">{subject}</p>
                <div className="w-full bg-slate-800 h-2 rounded overflow-hidden mb-1">
                  <div
                    className="bg-emerald-500 h-2"
                    style={{
                      width: `${
                        summary.total > 0
                          ? Math.round((summary.present / summary.total) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {summary.present} present / {summary.total} sessions
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No subject-wise data available.
          </p>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value }) => (
  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
    <p className="text-xs text-gray-400">{title}</p>
    <h3 className="text-xl font-semibold text-white mt-1">{value}</h3>
  </div>
);

const Th = ({ children }) => (
  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="px-3 py-2 align-middle text-xs text-gray-200">{children}</td>
);

export default AttendanceView;