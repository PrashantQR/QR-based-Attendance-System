import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { FaUsers } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const StudentList = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError('');
        const params = {};
        if (user?.course) params.course = user.course;
        if (user?.semester) params.semester = user.semester;

        const response = await api.get('/auth/students', { params });
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
  }, [user?.course, user?.semester]);

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
            View students for your current course, semester and subjects.
          </p>
          <div className="d-flex flex-wrap gap-2 mt-2">
            <span className="badge bg-dark border border-secondary">Course: {user?.course || 'N/A'}</span>
            <span className="badge bg-dark border border-secondary">Semester: {user?.semester || 'N/A'}</span>
            <span className="badge bg-dark border border-secondary">
              Subjects: {Array.isArray(user?.subjects) && user.subjects.length > 0 ? user.subjects.join(', ') : 'N/A'}
            </span>
          </div>
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
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Subjects</th>
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
                      <td>{student.course || 'N/A'}</td>
                      <td>{student.semester || 'N/A'}</td>
                      <td>{Array.isArray(student.subjects) ? student.subjects.join(', ') : 'N/A'}</td>
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

