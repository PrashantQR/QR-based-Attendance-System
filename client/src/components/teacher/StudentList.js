import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { FaUsers } from 'react-icons/fa';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/auth/students');
        setStudents(response.data.data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(
          err.response?.data?.message || 'Failed to load student list.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

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
          <h2 className="fw-bold text-white">Student List</h2>
          <p className="text-white-50">
            View all registered students in your classes.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-danger mb-3">{error}</div>}

          {students.length === 0 ? (
            <div className="text-center text-muted py-4">
              <FaUsers size={48} className="mb-3" />
              <p className="mb-0">No students registered.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Mobile Number</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.studentId}</td>
                      <td>{student.department}</td>
                      <td>{student.email}</td>
                      <td>{student.mobileNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentList;

