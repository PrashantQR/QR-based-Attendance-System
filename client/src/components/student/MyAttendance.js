import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const MyAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    attendanceRate: 0
  });
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const enrolledSubjects = Array.isArray(user?.subjects) ? user.subjects : [];
  const subjectSummary = attendance.reduce((acc, record) => {
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
          endDate
        }
      });

      console.log('Attendance response:', response.data);
      const data = response.data.data;
      setAttendance(data);

      // Calculate stats
      const presentCount = data.filter(a => a.status === 'present').length;
      const lateCount = data.filter(a => a.status === 'late').length;
      const totalCount = data.length;

      setStats({
        total: totalCount,
        present: presentCount,
        late: lateCount,
        attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">My Attendance</h2>
          <p className="text-white-50">View your attendance history</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title mb-3">
                <FaCalendarAlt className="me-2" />
                Date Range
              </h6>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="startDate" className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="endDate" className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Filter */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <label htmlFor="subjectFilter" className="form-label">Filter by Subject</label>
              <select
                id="subjectFilter"
                className="form-select"
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
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.total}</div>
            <div className="stats-label">Total Sessions</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.present}</div>
            <div className="stats-label">Present</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.late}</div>
            <div className="stats-label">Late</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.attendanceRate}%</div>
            <div className="stats-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  <FaChartBar className="me-2" />
                  Attendance History
                </h5>
                <span className="text-muted">
                  {filteredAttendance.length} records found
                </span>
              </div>

              {filteredAttendance.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover attendance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Course</th>
                        <th>Semester</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record) => (
                        <tr key={record._id}>
                          <td>
                            <strong>
                              {new Date(record.date).toLocaleDateString()}
                            </strong>
                          </td>
                          <td>
                            <span className={`status-badge status-${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                          <td>
                            {new Date(record.markedAt).toLocaleTimeString()}
                          </td>
                          <td>{record.location}</td>
                          <td>{record.course}</td>
                          <td>{record.semester || 'N/A'}</td>
                          <td>{record.subject || 'N/A'}</td>
                          <td>{record.teacher?.name || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaCalendarAlt size={50} className="mb-3" />
                  <p>No attendance records found for the selected date range</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {filteredAttendance.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Attendance Summary</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Total Sessions:</strong> {stats.total}</p>
                    <p><strong>Present Days:</strong> {stats.present}</p>
                    <p><strong>Course:</strong> {user?.course || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Late Days:</strong> {stats.late}</p>
                    <p><strong>Attendance Rate:</strong> {stats.attendanceRate}%</p>
                    <p><strong>Semester:</strong> {user?.semester || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject-wise Summary */}
      {attendance.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">Subject-wise Summary</h5>
                  <span className="text-muted">
                    {Object.keys(subjectSummary).length} subject{Object.keys(subjectSummary).length === 1 ? '' : 's'}
                  </span>
                </div>

                {Object.keys(subjectSummary).length > 0 ? (
                  <div className="row">
                    {Object.entries(subjectSummary).map(([subject, summary]) => {
                      const rate = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
                      return (
                        <div className="col-md-4 mb-3" key={subject}>
                          <div className="stats-card h-100">
                            <div className="stats-label">{subject}</div>
                            <div className="stats-number">{rate}%</div>
                            <small className="text-muted d-block">
                              {summary.present} present / {summary.total} sessions
                            </small>
                            <small className="text-muted d-block">
                              {summary.late} late
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted mb-0">No subject-wise attendance data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendance; 