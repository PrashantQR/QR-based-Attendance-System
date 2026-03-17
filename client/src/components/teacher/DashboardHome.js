import React, { useState, useEffect, useCallback } from 'react';
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
  const subjectSummary = stats.recentActivity.reduce((acc, record) => {
    const subject = record.qrCode?.subject || 'N/A';
    if (!acc[subject]) {
      acc[subject] = { total: 0, present: 0, late: 0 };
    }
    acc[subject].total += 1;
    if (record.status === 'present') acc[subject].present += 1;
    if (record.status === 'late') acc[subject].late += 1;
    return acc;
  }, {});

  const fetchDashboardStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's attendance
      const attendanceResponse = await api.get(`/attendance/daily?date=${today}`);
      const attendanceData = attendanceResponse.data.data;
      
      // Fetch active QR codes
      const qrResponse = await api.get('/qr/active');
      const activeQRCodes = qrResponse.data.count;
      
      // Fetch total students
      const studentsResponse = await api.get('/auth/students');
      const totalStudents = studentsResponse.data.count;

      setStats({
        todayAttendance: attendanceData.stats.total,
        activeQRCodes,
        totalStudents,
        recentActivity: attendanceData.attendance.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Token invalid or expired – log out and redirect
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
          <h2 className="fw-bold text-white">Teacher Dashboard</h2>
          <p className="text-white-50">Welcome back! Here's your overview for today.</p>
          <div className="d-flex flex-wrap gap-2 mt-2">
            <span className="badge bg-dark border border-secondary">
              Course: {user?.course || 'N/A'}
            </span>
            <span className="badge bg-dark border border-secondary">
              Semester: {user?.semester || 'N/A'}
            </span>
            <span className="badge bg-dark border border-secondary">
              Subjects: {Array.isArray(user?.subjects) && user.subjects.length > 0 ? user.subjects.join(', ') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Subject Summary */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Subject Summary</h5>
              {Object.keys(subjectSummary).length > 0 ? (
                <div className="row">
                  {Object.entries(subjectSummary).map(([subject, summary]) => (
                    <div className="col-md-4 mb-3" key={subject}>
                      <div className="stats-card h-100">
                        <div className="stats-label">{subject}</div>
                        <div className="stats-number">
                          {summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}%
                        </div>
                        <small className="text-muted d-block">
                          {summary.present} present / {summary.total} sessions
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">No subject-wise data available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.todayAttendance}</div>
            <div className="stats-label">Today's Attendance</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.activeQRCodes}</div>
            <div className="stats-label">Active QR Codes</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div
            className="stats-card"
            role="button"
            onClick={() => navigate('/teacher/students')}
          >
            <div className="stats-number">{stats.totalStudents}</div>
            <div className="stats-label">Total Students</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">
              {stats.totalStudents > 0 
                ? Math.round((stats.todayAttendance / stats.totalStudents) * 100)
                : 0}%
            </div>
            <div className="stats-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <Link to="/teacher/qr-generate" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaQrcode className="text-primary mb-3" size={40} />
                        <h6 className="card-title">Generate QR Code</h6>
                        <p className="card-text text-muted">Create a new QR code for your course/subject</p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/teacher/attendance" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaUsers className="text-success mb-3" size={40} />
                        <h6 className="card-title">View Attendance</h6>
                        <p className="card-text text-muted">Check attendance by course, semester and subject</p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/teacher/attendance" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaChartBar className="text-warning mb-3" size={40} />
                        <h6 className="card-title">Analytics</h6>
                        <p className="card-text text-muted">View subject-wise attendance statistics</p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/teacher/attendance" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaCalendarAlt className="text-info mb-3" size={40} />
                        <h6 className="card-title">History</h6>
                        <p className="card-text text-muted">View past attendance records</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Recent Activity</h5>
              {stats.recentActivity.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Mobile Number</th>
                        <th>Description</th>
                        <th>Course</th>
                        <th>Semester</th>
                        <th>Subject</th>
                        <th>Coordinates</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentActivity.map((record) => (
                        <tr key={record._id}>
                          <td>
                            <strong>{record.student.name}</strong>
                            <br />
                            <small className="text-muted">{record.student.studentId}</small>
                          </td>
                          <td>{record.student.mobileNumber}</td>
                          <td>{record.qrCode?.description || 'N/A'}</td>
                          <td>{record.qrCode?.course || 'N/A'}</td>
                          <td>{record.qrCode?.semester || 'N/A'}</td>
                          <td>{record.qrCode?.subject || 'N/A'}</td>
                          <td>
                            {record.coordinates && record.coordinates.latitude && record.coordinates.longitude ? (
                              <small className="text-muted">
                                {record.coordinates.latitude.toFixed(6)}, {record.coordinates.longitude.toFixed(6)}
                              </small>
                            ) : (
                              <small className="text-muted">N/A</small>
                            )}
                          </td>
                          <td>
                            {new Date(record.markedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 