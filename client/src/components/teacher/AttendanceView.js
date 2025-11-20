import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaTrash, FaDownload, FaEye } from 'react-icons/fa';

const AttendanceView = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/attendance/daily?date=${selectedDate}`);
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
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await axios.delete(`/api/attendance/${id}`);
        toast.success('Attendance record deleted successfully');
        fetchAttendance();
      } catch (error) {
        console.error('Error deleting attendance:', error);
        toast.error('Failed to delete attendance record');
      }
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
          <h2 className="fw-bold text-white">Attendance View</h2>
          <p className="text-white-50">View and manage attendance records</p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <label htmlFor="date" className="form-label">
                <FaCalendarAlt className="me-2" />
                Select Date
              </label>
              <input
                type="date"
                className="form-control"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.total || 0}</div>
            <div className="stats-label">Total Students</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.present || 0}</div>
            <div className="stats-label">Present</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">{stats.late || 0}</div>
            <div className="stats-label">Late</div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-number">
              {stats.total > 0 ? Math.round(((stats.present || 0) / stats.total) * 100) : 0}%
            </div>
            <div className="stats-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Attendance Records</h5>
                <div>
                  <button
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => window.print()}
                  >
                    <FaEye className="me-1" />
                    Print
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => {
                      // Export functionality would go here
                      toast.info('Export feature coming soon!');
                    }}
                  >
                    <FaDownload className="me-1" />
                    Export
                  </button>
                </div>
              </div>

              {attendance.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover attendance-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Department</th>
                        <th>Year</th>
                        <th>Mobile Number</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record._id}>
                          <td>
                            <strong>{record.student.name}</strong>
                          </td>
                          <td>{record.student.studentId}</td>
                          <td>{record.student.department}</td>
                          <td>{record.student.year}</td>
                          <td>{record.student.mobileNumber}</td>
                          <td>
                            <span className={`status-badge status-${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                          <td>
                            {new Date(record.markedAt).toLocaleTimeString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deleteAttendance(record._id)}
                              title="Delete record"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaCalendarAlt size={50} className="mb-3" />
                  <p>No attendance records found for this date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceView; 