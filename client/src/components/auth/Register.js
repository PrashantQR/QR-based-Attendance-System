import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { academicData, mapSemesterToYear } from '../../constants/academicData';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaIdCard, FaGraduationCap, FaPhone } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    course: '',
    semester: '',
    year: '',
    subjects: [],
    teacherDepartment: '',
    teacherCourse: '',
    teacherSemester: '',
    teacherSubjects: [],
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
      // When course changes, reset dependent academic fields
      if (name === 'course') {
        return {
          ...prev,
          course: value,
          semester: '',
          subjects: [],
          year: ''
        };
      }

      if (name === 'semester') {
        const computedYear = mapSemesterToYear(value);
        return {
          ...prev,
          semester: value,
          subjects: [],
          year: computedYear
        };
      }

      // Teacher academic hierarchy
      if (name === 'teacherCourse') {
        return {
          ...prev,
          teacherCourse: value,
          teacherSemester: '',
          teacherSubjects: []
        };
      }

      if (name === 'teacherSemester') {
        return {
          ...prev,
          teacherSemester: value,
          teacherSubjects: []
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
  };

  const availableSemesters = useMemo(() => {
    if (!formData.course || !academicData[formData.course]) return [];
    return Object.keys(academicData[formData.course]);
  }, [formData.course]);

  const availableSubjects = useMemo(() => {
    if (!formData.course || !formData.semester) return [];
    const courseData = academicData[formData.course];
    if (!courseData) return [];
    return courseData[formData.semester] || [];
  }, [formData.course, formData.semester]);

  const availableTeacherSemesters = useMemo(() => {
    if (!formData.teacherCourse || !academicData[formData.teacherCourse]) return [];
    return Object.keys(academicData[formData.teacherCourse]);
  }, [formData.teacherCourse]);

  const availableTeacherSubjects = useMemo(() => {
    if (!formData.teacherCourse || !formData.teacherSemester) return [];
    const courseData = academicData[formData.teacherCourse];
    if (!courseData) return [];
    return courseData[formData.teacherSemester] || [];
  }, [formData.teacherCourse, formData.teacherSemester]);

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

    // Additional validation for academic fields (students)
    if (formData.role === 'student') {
      if (!formData.course) {
        alert('Please select Course');
        setLoading(false);
        return;
      }

      if (!formData.semester) {
        alert('Please select Semester');
        setLoading(false);
        return;
      }

      if (!formData.subjects || formData.subjects.length === 0) {
        alert('Please select at least one Subject');
        setLoading(false);
        return;
      }
      if (!formData.year) {
        alert('Year could not be determined from semester');
        setLoading(false);
        return;
      }
    } else if (formData.role === 'teacher') {
      if (!formData.teacherDepartment.trim()) {
        alert('Please enter department');
        setLoading(false);
        return;
      }

      if (!formData.teacherCourse) {
        alert('Please select teacher course');
        setLoading(false);
        return;
      }

      if (!formData.teacherSemester) {
        alert('Please select teacher semester');
        setLoading(false);
        return;
      }

      if (!formData.teacherSubjects || formData.teacherSubjects.length === 0) {
        alert('Please select at least one subject');
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
        userData.studentId = formData.studentId;
        userData.course = formData.course;
        userData.semester = formData.semester;
        userData.year = formData.year;
        userData.subjects = formData.subjects;
        userData.department = formData.course;
      } else if (formData.role === 'teacher') {
        userData.department = formData.teacherDepartment.trim();
        userData.course = formData.teacherCourse;
        userData.semester = formData.teacherSemester;
        userData.subjects = formData.teacherSubjects;
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-3xl bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-soft-glass p-6 md:p-8"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-1">Create account</h2>
          <p className="text-sm text-gray-400">Join the QR Attendance System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-300">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWithIcon
              icon={<FaUser />}
              id="name"
              label="Full name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
            <InputWithIcon
              icon={<FaEnvelope />}
              id="email"
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          {/* Teacher specific */}
          {formData.role === 'teacher' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputWithIcon
                  icon={<FaGraduationCap />}
                  id="teacherDepartment"
                  label="Department"
                  name="teacherDepartment"
                  value={formData.teacherDepartment}
                  onChange={handleChange}
                  placeholder="e.g., MCA"
                />
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Course
                  </label>
                  <select
                    id="teacherCourse"
                    name="teacherCourse"
                    value={formData.teacherCourse}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                  >
                    <option value="">Select course</option>
                    {Object.keys(academicData).map((courseKey) => (
                      <option key={courseKey} value={courseKey}>
                        {courseKey}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Semester
                  </label>
                  <select
                    id="teacherSemester"
                    name="teacherSemester"
                    value={formData.teacherSemester}
                    onChange={handleChange}
                    disabled={!formData.teacherCourse}
                    className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                  >
                    <option value="">
                      {formData.teacherCourse ? 'Select semester' : 'Select course first'}
                    </option>
                    {availableTeacherSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-300">
                    Subjects (multi-select)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        teacherSubjects: availableTeacherSubjects
                      }))
                    }
                    disabled={availableTeacherSubjects.length === 0}
                    className="text-[11px] px-2 py-1 rounded-full border border-accent/60 text-accent hover:bg-accent/10 disabled:opacity-50"
                  >
                    Select all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTeacherSubjects.length === 0 && (
                    <span className="text-xs text-gray-500">
                      {formData.teacherSemester
                        ? 'No subjects available'
                        : 'Select course and semester'}
                    </span>
                  )}
                  {availableTeacherSubjects.map((subj) => {
                    const checked = formData.teacherSubjects.includes(subj);
                    return (
                      <label
                        key={subj}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border cursor-pointer ${
                          checked
                            ? 'bg-accent/20 border-accent text-emerald-200'
                            : 'border-white/15 text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={subj}
                          checked={checked}
                          onChange={(e) => {
                            setFormData((prev) => {
                              if (e.target.checked) {
                                return {
                                  ...prev,
                                  teacherSubjects: [...prev.teacherSubjects, subj]
                                };
                              }
                              return {
                                ...prev,
                                teacherSubjects: prev.teacherSubjects.filter((s) => s !== subj)
                              };
                            });
                          }}
                          className="w-3 h-3 accent-emerald-400"
                        />
                        <span>{subj}</span>
                      </label>
                    );
                  })}
                </div>
                {formData.teacherSubjects.length > 0 && (
                  <p className="text-[11px] text-gray-400">
                    {formData.teacherSubjects.length} subjects selected
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Mobile */}
          <InputWithIcon
            icon={<FaPhone />}
            id="mobileNumber"
            label="Mobile number"
            name="mobileNumber"
            type="tel"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="Enter your 10-digit mobile number"
            maxLength={10}
          />

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PasswordInput
              id="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              show={showPassword}
              setShow={setShowPassword}
            />
            <PasswordInput
              id="confirmPassword"
              label="Confirm password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
            />
          </div>

          {/* Student-specific */}
          {formData.role === 'student' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithIcon
                  icon={<FaIdCard />}
                  id="studentId"
                  label="Student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="Enter student ID"
                />
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Course
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
                      <FaGraduationCap />
                    </span>
                    <select
                      id="course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                    >
                      <option value="">Select course</option>
                      {Object.keys(academicData).map((courseKey) => (
                        <option key={courseKey} value={courseKey}>
                          {courseKey}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Semester
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    disabled={!formData.course}
                    className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                  >
                    <option value="">
                      {formData.course ? 'Select semester' : 'Select course first'}
                    </option>
                    {availableSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Year
                  </label>
                  <input
                    id="year"
                    name="year"
                    value={formData.year}
                    readOnly
                    placeholder="Auto-selected from semester"
                    className="w-full rounded-xl bg-primary/40 border border-white/10 px-3 py-2.5 text-sm text-gray-300 placeholder-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-300">
                      Subjects (multi-select)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          subjects: availableSubjects
                        }))
                      }
                      disabled={availableSubjects.length === 0}
                      className="text-[11px] px-2 py-1 rounded-full border border-accent/60 text-accent hover:bg-accent/10 disabled:opacity-50"
                    >
                      Select all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!formData.semester && (
                      <span className="text-xs text-gray-500">Select semester first</span>
                    )}
                    {formData.semester && availableSubjects.length === 0 && (
                      <span className="text-xs text-gray-500">No subjects available</span>
                    )}
                    {availableSubjects.map((subj) => {
                      const checked = formData.subjects.includes(subj);
                      return (
                        <label
                          key={subj}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border cursor-pointer ${
                            checked
                              ? 'bg-accent/20 border-accent text-emerald-200'
                              : 'border-white/15 text-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={subj}
                            checked={checked}
                            onChange={(e) => {
                              setFormData((prev) => {
                                if (e.target.checked) {
                                  return {
                                    ...prev,
                                    subjects: [...prev.subjects, subj]
                                  };
                                }
                                return {
                                  ...prev,
                                  subjects: prev.subjects.filter((s) => s !== subj)
                                };
                              });
                            }}
                            className="w-3 h-3 accent-emerald-400"
                          />
                          <span>{subj}</span>
                        </label>
                      );
                    })}
                  </div>
                  {formData.subjects.length > 0 && (
                    <p className="text-[11px] text-gray-400">
                      {formData.subjects.length} subjects selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-full bg-accent text-sm font-semibold text-secondary py-2.5 mt-2 hover:bg-emerald-400 transition shadow-soft-glass disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <div className="text-center text-xs text-gray-400 mt-3">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-300 hover:text-emerald-200 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const InputWithIcon = ({ icon, label, id, className = '', ...rest }) => (
  <div className={['space-y-1', className].join(' ')}>
    <label htmlFor={id} className="block text-xs font-medium text-gray-300">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
        {icon}
      </span>
      <input
        id={id}
        {...rest}
        className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
      />
    </div>
  </div>
);

const Input = ({ label, id, className = '', ...rest }) => (
  <div className={['space-y-1', className].join(' ')}>
    <label htmlFor={id} className="block text-xs font-medium text-gray-300">
      {label}
    </label>
    <input
      id={id}
      {...rest}
      className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
    />
  </div>
);

const PasswordInput = ({ label, id, show, setShow, ...rest }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-medium text-gray-300">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
        <FaLock />
      </span>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        {...rest}
        className="w-full rounded-xl bg-primary/70 border border-white/10 pl-9 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-400 hover:text-gray-200"
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  </div>
);

export default Register; 