import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaIdCard, FaGraduationCap, FaPhone } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    classCourse: '',
    customCourse: '',
    stream: '',
    branch: '',
    year: 1,
    teacherDepartment: '',
    teacherSubject: '',
    teacherCustomSubject: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // When class / course changes, reset dependent fields and year to 1
      if (name === 'classCourse') {
        return {
          ...prev,
          classCourse: value,
          stream: '',
          branch: '',
          customCourse: '',
          year: 1
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate mobile number format
    const mobileRegex = /^[0-9]{10}$/;
    if (formData.mobileNumber && !mobileRegex.test(formData.mobileNumber)) {
      alert('Mobile number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    // Additional validation for class / course specific fields (students)
    if (formData.role === 'student') {
      const classCourse = formData.classCourse;

      if (!classCourse) {
        alert('Please select Class / Course');
        setLoading(false);
        return;
      }

      const isOtherCourse = classCourse === 'OTHER';

      const needsStream = classCourse === '11th Standard' || classCourse === '12th Standard';
      const needsBranch = ['BE', 'BTech', 'MTech'].includes(classCourse);

      if (isOtherCourse && !formData.customCourse.trim()) {
        alert('Please enter course name');
        setLoading(false);
        return;
      }

      if (needsStream && !formData.stream) {
        alert('Please select Stream');
        setLoading(false);
        return;
      }

      if (needsBranch && !formData.branch) {
        alert('Please select Branch');
        setLoading(false);
        return;
      }
    } else if (formData.role === 'teacher') {
      if (!formData.teacherDepartment.trim()) {
        alert('Please enter department');
        setLoading(false);
        return;
      }

      if (!formData.teacherSubject) {
        alert('Please select subject');
        setLoading(false);
        return;
      }

      if (formData.teacherSubject === 'OTHER' && !formData.teacherCustomSubject.trim()) {
        alert('Please enter custom subject');
        setLoading(false);
        return;
      }
    }

    try {
      // Debug: log outgoing signup payload
      console.log('Register - submitting signup form with data:', formData);
      const userData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        password: formData.password,
        role: formData.role
      };

      // Add student-specific fields if role is student
      if (formData.role === 'student') {
        const classCourse = formData.classCourse;
        const needsStream = classCourse === '11th Standard' || classCourse === '12th Standard';
        const needsBranch = ['BE', 'BTech', 'MTech'].includes(classCourse);

        let departmentValue = classCourse === 'OTHER'
          ? formData.customCourse.trim()
          : classCourse;

        if (needsStream && formData.stream) {
          departmentValue = `${classCourse} - ${formData.stream}`;
        } else if (needsBranch && formData.branch) {
          departmentValue = `${classCourse} - ${formData.branch}`;
        }

        userData.studentId = formData.studentId;
        userData.department = departmentValue;
        userData.year = parseInt(formData.year);
      } else if (formData.role === 'teacher') {
        const chosenSubject =
          formData.teacherSubject === 'OTHER'
            ? formData.teacherCustomSubject.trim()
            : formData.teacherSubject;

        userData.department = formData.teacherDepartment.trim();
        userData.subjects = [chosenSubject];
      }

      const result = await register(userData);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center align-items-center min-vh-100">
      <div className="col-md-8 col-lg-6">
        <div className="card">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-primary">Create Account</h2>
              <p className="text-muted">Join the QR Attendance System</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="role" className="form-label">
                  Role
                </label>
                <select
                  className="form-select"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>

              {formData.role === 'teacher' && (
                <>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="teacherDepartment" className="form-label">
                        Department
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaGraduationCap />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="teacherDepartment"
                          name="teacherDepartment"
                          value={formData.teacherDepartment}
                          onChange={handleChange}
                          placeholder="e.g., MCA"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="teacherSubject" className="form-label">
                        Subject
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaGraduationCap />
                        </span>
                        <select
                          className="form-select"
                          id="teacherSubject"
                          name="teacherSubject"
                          value={formData.teacherSubject}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Subject</option>
                          <option value="Data Structures">Data Structures</option>
                          <option value="DBMS">DBMS</option>
                          <option value="Operating Systems">Operating Systems</option>
                          <option value="Computer Networks">Computer Networks</option>
                          <option value="Software Engineering">Software Engineering</option>
                          <option value="OTHER">Add Custom Subject</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {formData.teacherSubject === 'OTHER' && (
                    <div className="mb-3">
                      <label htmlFor="teacherCustomSubject" className="form-label">
                        Custom Subject
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="teacherCustomSubject"
                        name="teacherCustomSubject"
                        value={formData.teacherCustomSubject}
                        onChange={handleChange}
                        placeholder="Enter subject name"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className="mb-3">
                <label htmlFor="mobileNumber" className="form-label">
                  Mobile Number
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaPhone />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter your 10-digit mobile number"
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              {formData.role === 'student' && (
                <>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="studentId" className="form-label">
                        Student ID
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaIdCard />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="studentId"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleChange}
                          required
                          placeholder="Enter student ID"
                        />
                      </div>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label htmlFor="classCourse" className="form-label">
                        Class / Course
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaGraduationCap />
                        </span>
                        <select
                          className="form-select"
                          id="classCourse"
                          name="classCourse"
                          value={formData.classCourse}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Class / Course</option>
                          <option value="1st Standard">1st Standard</option>
                          <option value="2nd Standard">2nd Standard</option>
                          <option value="3rd Standard">3rd Standard</option>
                          <option value="4th Standard">4th Standard</option>
                          <option value="5th Standard">5th Standard</option>
                          <option value="6th Standard">6th Standard</option>
                          <option value="7th Standard">7th Standard</option>
                          <option value="8th Standard">8th Standard</option>
                          <option value="9th Standard">9th Standard</option>
                          <option value="10th Standard">10th Standard</option>
                          <option value="11th Standard">11th Standard</option>
                          <option value="12th Standard">12th Standard</option>
                          <option value="BA">BA</option>
                          <option value="BCom">BCom</option>
                          <option value="BSc">BSc</option>
                          <option value="BE">BE</option>
                          <option value="BTech">BTech</option>
                          <option value="BCA">BCA</option>
                          <option value="BBA">BBA</option>
                          <option value="MA">MA</option>
                          <option value="MCom">MCom</option>
                          <option value="MSc">MSc</option>
                          <option value="MCA">MCA</option>
                          <option value="MBA">MBA</option>
                          <option value="MTech">MTech</option>
                          <option value="OTHER">Other (Enter Manually)</option>
                        </select>
                      </div>
                    </div>

                    {formData.classCourse === 'OTHER' && (
                      <div className="col-md-4 mb-3">
                        <label htmlFor="customCourse" className="form-label">
                          Enter Course Name
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaGraduationCap />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            id="customCourse"
                            name="customCourse"
                            value={formData.customCourse}
                            onChange={handleChange}
                            placeholder="e.g. Diploma, Polytechnic, PhD"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {(formData.classCourse === '11th Standard' ||
                      formData.classCourse === '12th Standard') && (
                      <div className="col-md-4 mb-3">
                        <label htmlFor="stream" className="form-label">
                          Stream
                        </label>
                        <select
                          className="form-select"
                          id="stream"
                          name="stream"
                          value={formData.stream}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Stream</option>
                          <option value="Science">Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                    )}

                    {['BE', 'BTech', 'MTech'].includes(formData.classCourse) && (
                      <div className="col-md-4 mb-3">
                        <label htmlFor="branch" className="form-label">
                          Branch
                        </label>
                        <select
                          className="form-select"
                          id="branch"
                          name="branch"
                          value={formData.branch}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Branch</option>
                          <option value="Computer Engineering">Computer Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="IT">IT</option>
                        </select>
                      </div>
                    )}

                    {['BA','BCom','BSc','BE','BTech','BCA','BBA','MA','MCom','MSc','MCA','MBA','MTech'].includes(formData.classCourse) && (
                      <div className="col-md-4 mb-3">
                        <label htmlFor="year" className="form-label">
                          Year
                        </label>
                        <select
                          className="form-select"
                          id="year"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          required
                        >
                          {['BA','BSc','BCom','BCA'].includes(formData.classCourse) && (
                            <>
                              <option value={1}>1st Year</option>
                              <option value={2}>2nd Year</option>
                              <option value={3}>3rd Year</option>
                            </>
                          )}
                          {['BE','BTech'].includes(formData.classCourse) && (
                            <>
                              <option value={1}>1st Year</option>
                              <option value={2}>2nd Year</option>
                              <option value={3}>3rd Year</option>
                              <option value={4}>4th Year</option>
                            </>
                          )}
                          {['MBA','MSc','MCom','MCA'].includes(formData.classCourse) && (
                            <>
                              <option value={1}>1st Year</option>
                              <option value={2}>2nd Year</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}


              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="text-center">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary fw-bold">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 