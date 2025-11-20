import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaQrcode, FaUsers, FaChartBar, FaCalendarAlt } from 'react-icons/fa';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    todayAttendance: 0,
    activeQRCodes: 0,
    totalStudents: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's attendance
      const attendanceResponse = await axios.get(`/api/attendance/daily?date=${today}`);
      const attendanceData = attendanceResponse.data.data;
      
      // Fetch active QR codes
      const qrResponse = await axios.get('/api/qr/active');
      const activeQRCodes = qrResponse.data.count;
      
      // Fetch total students
      const studentsResponse = await axios.get('/api/auth/students');
      const totalStudents = studentsResponse.data.count;

      setStats({
        todayAttendance: attendanceData.stats.total,
        activeQRCodes,
        totalStudents,
        recentActivity: attendanceData.attendance.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="stats-card">
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
                        <p className="card-text text-muted">Create a new QR code for attendance</p>
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
                        <p className="card-text text-muted">Check today's attendance records</p>
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
                        <p className="card-text text-muted">View attendance statistics</p>
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