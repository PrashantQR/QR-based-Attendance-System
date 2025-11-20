import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { FaQrcode, FaCalendarAlt, FaUser } from 'react-icons/fa';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAttendance: 0,
    presentDays: 0,
    lateDays: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentStats();
  }, []);

  const fetchStudentStats = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const response = await axios.get('/api/attendance/my-attendance', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });

      const attendance = response.data.data;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      const totalCount = attendance.length;

      setStats({
        totalAttendance: totalCount,
        presentDays: presentCount,
        lateDays: lateCount,
        attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
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
          <h2 className="fw-bold text-white">Student Dashboard</h2>
          <p className="text-white-50">Welcome back, {user?.name}!</p>
        </div>
      </div>

      {/* Quick Actions - moved above stats */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <Link to="/student/scan" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaQrcode className="text-primary mb-3" size={40} />
                        <h6 className="card-title">Scan QR Code</h6>
                        <p className="card-text text-muted">Mark your attendance</p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link to="/student/my-attendance" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaCalendarAlt className="text-success mb-3" size={40} />
                        <h6 className="card-title">My Attendance</h6>
                        <p className="card-text text-muted">View your attendance history</p>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link to="/profile" className="text-decoration-none">
                    <div className="card text-center h-100">
                      <div className="card-body">
                        <FaUser className="text-info mb-3" size={40} />
                        <h6 className="card-title">Profile</h6>
                        <p className="card-text text-muted">Update your profile</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.totalAttendance}</div>
            <div className="stats-label">Total Sessions</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.presentDays}</div>
            <div className="stats-label">Present Days</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.lateDays}</div>
            <div className="stats-label">Late Days</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.attendanceRate}%</div>
            <div className="stats-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Student Information</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Student ID:</strong> {user?.studentId}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Department:</strong> {user?.department}</p>
                  <p><strong>Year:</strong> {user?.year}</p>
                  <p><strong>Mobile Number:</strong> {user?.mobileNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 