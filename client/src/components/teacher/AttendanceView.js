import React, { useState, useEffect, useCallback } from 'react';
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

  const [subjectSummary, setSubjectSummary] = useState([]);

  const [showStudents, setShowStudents] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState([]);

  const selectedSubjectLabel =
    subjectFilter === 'all' ? 'All Subjects' : subjectFilter;

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const formattedDate = new Date(selectedDate)
        .toISOString()
        .split('T')[0];

      const subject =
        subjectFilter === 'all' ? '' : encodeURIComponent(subjectFilter);
      const subjectQuery = subject ? `&subject=${subject}` : '';

      const response = await api.get(
        `/attendance?date=${formattedDate}${subjectQuery}`
      );

      const data = response.data?.data;
      setAttendance(Array.isArray(data?.attendance) ? data.attendance : []);
      setStats(data?.stats || {});
      setSubjectSummary(
        Array.isArray(data?.subjectSummary) ? data.subjectSummary : []
      );
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, subjectFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const fetchRegisteredStudents = useCallback(async () => {
    if (!user?._id) return;

    setStudentsLoading(true);
    try {
      const subject = subjectFilter === 'all' ? '' : subjectFilter;
      const course = user?.course || '';
      const semester = user?.semester || '';

      const params = new URLSearchParams();
      params.append('teacherId', String(user._id));
      if (subject) params.append('subject', subject);
      if (course) params.append('course', course);
      if (semester) params.append('semester', semester);

      const res = await api.get(`/students?${params.toString()}`);
      const data = res.data?.data;
      setRegisteredStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching registered students:', error);
      toast.error('Failed to fetch registered students');
      setRegisteredStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [user?._id, subjectFilter, user?.course, user?.semester]);

  const handleTotalStudentsClick = async () => {
    await fetchRegisteredStudents();
    setShowStudents(true);
  };

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

  const getLocationMeta = (record) => {
    const latitude = Number(record?.coordinates?.latitude);
    const longitude = Number(record?.coordinates?.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return {
        label: 'N/A',
        mapUrl: null
      };
    }

    const latText = latitude.toFixed(4);
    const lngText = longitude.toFixed(4);
    return {
      label: `${latText}, ${lngText}`,
      mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-sm text-gray-400">Loading attendance...</p>
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
          <div
            onClick={handleTotalStudentsClick}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
          >
            <SummaryCard title="Total Students" value={stats.total || 0} />
          </div>
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

        {attendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-slate-800/90">
                <tr>
                  <Th>Student Name</Th>
                  <Th>Student ID</Th>
                  <Th>Course</Th>
                  <Th>Semester</Th>
                  <Th>Subject</Th>
                  <Th>Year</Th>
                  <Th>Mobile</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th>Time</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-slate-800 hover:bg-slate-800/60"
                  >
                    <Td>
                      <span className="font-semibold">
                        {record.student?.name || 'N/A'}
                      </span>
                    </Td>
                    <Td>{record.student?.studentId || 'N/A'}</Td>
                    <Td>{record.qrCode?.course || '—'}</Td>
                    <Td>{record.qrCode?.semester || '—'}</Td>
                    <Td>{record.qrCode?.subject || '—'}</Td>
                    <Td>{record.student?.year || 'N/A'}</Td>
                    <Td>
                      <span className="inline-block max-w-[8rem] truncate">
                        {record.student?.mobileNumber || 'N/A'}
                      </span>
                    </Td>
                    <Td>
                      {(() => {
                        const location = getLocationMeta(record);
                        if (!location.mapUrl) {
                          return <span className="text-gray-400">N/A</span>;
                        }
                        return (
                          <a
                            href={location.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Click to open in Google Maps"
                            className="inline-block max-w-[10rem] truncate text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                          >
                            <span className="text-[11px]">{location.label}</span>
                          </a>
                        );
                      })()}
                    </Td>
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
            <p>No records found for selected filters</p>
          </div>
        )}
      </div>

      {/* Subject-wise Summary */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Subject-wise Summary
        </h2>
        {subjectSummary.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {subjectSummary.map((s) => (
              <div
                key={s.subject || 'unknown'}
                className="bg-slate-950/70 border border-slate-700 rounded-xl p-4"
              >
                <p className="text-sm text-slate-100 mb-1">
                  {s.subject || '—'}
                </p>
                <div className="w-full bg-slate-800 h-2 rounded overflow-hidden mb-1">
                  <div
                    className="bg-emerald-500 h-2"
                    style={{
                      width: `${Math.round(s.percentage || 0)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {s.present || 0} present / {s.total || 0} sessions
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

      {/* Registered Students Modal */}
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
                  Registered Students
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedSubjectLabel} • {user?.course || '—'} •{' '}
                  {user?.semester || '—'}
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
            ) : registeredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-200">
                  <thead className="bg-slate-800/90">
                    <tr>
                      <Th>Student Name</Th>
                      <Th>Student ID</Th>
                      <Th>Course</Th>
                      <Th>Semester</Th>
                      <Th>Mobile</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredStudents.map((s) => (
                      <tr
                        key={s._id}
                        className="border-b border-slate-800 hover:bg-slate-800/60"
                      >
                        <Td>
                          <span className="font-semibold">{s.name}</span>
                        </Td>
                        <Td>{s.studentId}</Td>
                        <Td>{s.course || '—'}</Td>
                        <Td>{s.semester || '—'}</Td>
                        <Td>{s.mobileNumber || '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No students found for selected filters.
              </p>
            )}
          </div>
        </div>
      )}
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