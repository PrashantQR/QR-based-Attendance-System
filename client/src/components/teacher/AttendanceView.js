import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceView = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');

  const [showStudents, setShowStudents] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [courseStudentsTotal, setCourseStudentsTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalSessions, setTotalSessions] = useState(0);

  const [teacherSubjectOptions, setTeacherSubjectOptions] = useState([]);
  const [teacherSubjectsLoading, setTeacherSubjectsLoading] = useState(false);

  const subjectOptions = useMemo(() => {
    if (Array.isArray(user?.subjects) && user.subjects.length > 0) {
      return user.subjects;
    }
    return teacherSubjectOptions;
  }, [user?.subjects, teacherSubjectOptions]);

  const selectedSubjectLabel =
    subjectFilter === 'all' ? 'All Subjects' : subjectFilter;

  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      if (user?.role !== 'teacher') return;
      if (!user?._id) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.role, user?.subjects]);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const subject =
        subjectFilter === 'all' ? '' : encodeURIComponent(subjectFilter);
      const subjectQuery = subject ? `&subject=${subject}` : '';

      const response = await api.get(
        `/attendance?date=${selectedDate}${subjectQuery}`
      );

      const data = response.data?.data || {};
      const safeAttendance = Array.isArray(data.attendance)
        ? data.attendance
        : [];
      if (!Array.isArray(data.attendance) && data.attendance != null) {
        // eslint-disable-next-line no-console
        console.warn('Expected attendance array but got:', data.attendance);
      }
      setAttendance(safeAttendance);
      setTotalSessions(Number(data.totalSessions || 0));
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
      const course = user?.course || '';
      const semester = user?.semester || '';

      const params = new URLSearchParams();
      params.append('teacherId', String(user._id));
      if (subjectFilter !== 'all') params.append('subject', subjectFilter);
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

  const fetchCourseStudentsTotal = useCallback(async () => {
    if (!user?._id) return;
    try {
      const course = user?.course || '';
      const semester = user?.semester || '';

      const params = new URLSearchParams();
      params.append('teacherId', String(user._id));
      if (course) params.append('course', course);
      if (semester) params.append('semester', semester);

      const res = await api.get(`/students?${params.toString()}`);
      setCourseStudentsTotal(Number(res.data?.count || 0));
    } catch (error) {
      console.error('Error fetching total registered students:', error);
      setCourseStudentsTotal(0);
    }
  }, [user?._id, user?.course, user?.semester]);

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

  const attendanceRate = useMemo(() => {
    if (!courseStudentsTotal) return 0;
    const presentStudentIds = new Set(
      attendance
        .filter((record) => record.status === 'present')
        .map((record) => String(record.student?._id || record.student))
    );

    return Math.round(
      (presentStudentIds.size / Number(courseStudentsTotal || 1)) * 100
    );
  }, [attendance, courseStudentsTotal]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const processedAttendance = useMemo(() => {
    const filtered = attendance.filter((record) => {
      if (!normalizedSearch) return true;
      return String(record.student?.name || '')
        .toLowerCase()
        .includes(normalizedSearch);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'status') {
        const v1 = String(a.status || '').toLowerCase();
        const v2 = String(b.status || '').toLowerCase();
        return sortOrder === 'asc'
          ? v1.localeCompare(v2)
          : v2.localeCompare(v1);
      }

      const t1 = new Date(a.markedAt).getTime();
      const t2 = new Date(b.markedAt).getTime();
      return sortOrder === 'asc' ? t1 - t2 : t2 - t1;
    });

    return sorted;
  }, [attendance, normalizedSearch, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processedAttendance.length / pageSize));

  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedAttendance.slice(start, start + pageSize);
  }, [processedAttendance, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, subjectFilter, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchCourseStudentsTotal();
  }, [fetchCourseStudentsTotal]);

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

  const hasSessions = totalSessions > 0;

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
            {subjectOptions && subjectOptions.length > 0
              ? subjectOptions.join(', ')
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Filters and controls */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
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
          <div>
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
              {subjectOptions && subjectOptions.length ? (
                subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))
              ) : (
                <option value="all" disabled>
                  {teacherSubjectsLoading ? 'Loading…' : 'No subjects'}
                </option>
              )}
            </select>
          </div>
          <div>
            <label
              htmlFor="searchStudent"
              className="block text-xs font-semibold text-gray-400 mb-2"
            >
              Search Student Name
            </label>
            <input
              id="searchStudent"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type student name..."
              className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTotalStudentsClick}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 text-xs font-medium hover:bg-cyan-500/10"
              title="View registered students"
            >
              Total Registered Students: {courseStudentsTotal}
            </button>
            <span className="px-3 py-1.5 rounded-lg border border-slate-700 text-gray-300 text-xs">
              Filtered Records: {processedAttendance.length}
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-slate-700 text-gray-300 text-xs">
              Attendance %: {attendanceRate}%
            </span>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-gray-200"
            >
              <option value="time">Sort: Time</option>
              <option value="status">Sort: Status</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-gray-200"
            >
              <option value="desc">Order: Desc</option>
              <option value="asc">Order: Asc</option>
            </select>
          </div>
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
              onClick={() => {
                if (!hasSessions) return;
                window.print();
              }}
              disabled={!hasSessions}
            >
              <FaEye className="text-xs" />
              Print
            </button>
            <button
              className="px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-400 text-xs font-medium flex items-center gap-1 hover:bg-emerald-500/10"
              onClick={() => {
                if (!hasSessions) return;
                toast.info('Export feature coming soon!');
              }}
              disabled={!hasSessions}
            >
              <FaDownload className="text-xs" />
              Export
            </button>
          </div>
        </div>

        {!hasSessions ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm text-center">
            <FaCalendarAlt size={40} className="mb-3 text-gray-500" />
            <p>No session conducted on this date.</p>
            <p className="mt-1 text-xs text-gray-500">
              Check the selected date and subject above.
            </p>
          </div>
        ) : paginatedAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm text-gray-200">
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
                {paginatedAttendance.map((record) => (
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
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm text-center">
            <FaCalendarAlt size={40} className="mb-3 text-gray-500" />
            <p>No attendance records found for this session</p>
            <p className="mt-1 text-xs text-gray-500">
              Check the selected date and subject above.
            </p>
          </div>
        )}

        {processedAttendance.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-700 text-gray-300 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-700 text-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
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
                <p className="text-xs text-gray-500 mt-1">
                  Total registered in course: {courseStudentsTotal}
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

const Th = ({ children }) => (
  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="px-3 py-2 align-middle text-xs text-gray-200">{children}</td>
);

export default AttendanceView;