import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { academicData, mapSemesterToYear } from '../../constants/academicData';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaIdCard, FaGraduationCap, FaPhone } from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const defaultCourses = ['MCA', 'BCA', 'BSc', 'BA', 'BCom'];

const courseSemesters = {
  MCA: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  BCA: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
  BSc: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
  BA: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
  BCom: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
  BE: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']
};

const defaultSemesters = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];

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
    customCourse: '',
    semester: '',
    year: '',
    subjects: [],
    teacherCourse: '',
    teacherCustomCourse: '',
    teacherSemester: '',
    teacherSubjects: [],
    teacherCustomSubject: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [availableTeacherSubjects, setAvailableTeacherSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  
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
          customCourse: '',
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
          teacherCustomCourse: '',
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

  const finalCourse =
    formData.course === 'Other' ? formData.customCourse.trim() : formData.course;

  const finalTeacherCourse =
    formData.teacherCourse === 'Other'
      ? formData.teacherCustomCourse.trim()
      : formData.teacherCourse;

  const studentSemesters = useMemo(() => {
    if (!finalCourse) return [];
    return courseSemesters[finalCourse] || defaultSemesters;
  }, [finalCourse]);

  const teacherSemesters = useMemo(() => {
    if (!finalTeacherCourse) return [];
    return courseSemesters[finalTeacherCourse] || defaultSemesters;
  }, [finalTeacherCourse]);

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

      if (formData.course === 'Other' && !formData.customCourse.trim()) {
        alert('Please enter custom course');
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
      if (!formData.teacherCourse) {
        alert('Please select teacher course');
        setLoading(false);
        return;
      }

      if (formData.teacherCourse === 'Other' && !formData.teacherCustomCourse.trim()) {
        alert('Please enter custom teacher course');
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
        userData.course = finalCourse;
        userData.semester = formData.semester;
        userData.year = formData.year;
        userData.subjects = formData.subjects;
      } else if (formData.role === 'teacher') {
        userData.course = finalTeacherCourse;
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

  // Load courses for both student and teacher on mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        const json = res.data;
        if (json?.success) {
          const dbCourses = (json.data || []).map((c) => c.name);
          const merged = [...new Set([...defaultCourses, ...dbCourses])];
          setCourses(merged);
          setTeacherCourses(merged);
        }
      } catch (e) {
        console.error('Error fetching courses', e);
        setCourses(defaultCourses);
        setTeacherCourses(defaultCourses);
      }
    };
    fetchCourses();
  }, []);

  // Load subjects for student when course+semester selected (standard + DB-backed)
  React.useEffect(() => {
    const loadSubjects = async () => {
      if (!formData.course || !formData.semester) {
        setAvailableSubjects([]);
        return;
      }
      try {
        const standardSubjects =
          academicData[finalCourse]?.[formData.semester] || [];

        const res = await api.get('/subjects', {
          params: { course: finalCourse, semester: formData.semester }
        });
        const json = res.data;

        const dbSubjects = json?.success
          ? (json.data || []).map((s) => s.name)
          : [];

        const merged = [...new Set([...standardSubjects, ...dbSubjects])];
        setAvailableSubjects(merged);
      } catch (e) {
        console.error('Error fetching subjects', e);
        const fallback =
          academicData[finalCourse]?.[formData.semester] || [];
        setAvailableSubjects(fallback);
      }
    };
    loadSubjects();
  }, [formData.course, formData.semester, formData.customCourse, finalCourse]);

  // Load subjects for teacher when course+semester selected (standard + DB-backed)
  React.useEffect(() => {
    const loadTeacherSubjects = async () => {
      if (!formData.teacherCourse || !formData.teacherSemester) {
        setAvailableTeacherSubjects([]);
        return;
      }
      try {
        const standardSubjects =
          academicData[finalTeacherCourse]?.[formData.teacherSemester] || [];

        const res = await api.get('/subjects', {
          params: { course: finalTeacherCourse, semester: formData.teacherSemester }
        });
        const json = res.data;

        const dbSubjects = json?.success
          ? (json.data || []).map((s) => s.name)
          : [];

        const merged = [...new Set([...standardSubjects, ...dbSubjects])];
        setAvailableTeacherSubjects(merged);
      } catch (e) {
        console.error('Error fetching teacher subjects', e);
        const fallback =
          academicData[finalTeacherCourse]?.[formData.teacherSemester] || [];
        setAvailableTeacherSubjects(fallback);
      }
    };
    loadTeacherSubjects();
  }, [formData.teacherCourse, formData.teacherSemester, formData.teacherCustomCourse, finalTeacherCourse]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {teacherCourses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.teacherCourse === 'Other' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-300">
                      Custom course
                    </label>
                    <input
                      type="text"
                      placeholder="Enter custom teacher course"
                      value={formData.teacherCustomCourse}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          teacherCustomCourse: e.target.value
                        }))
                      }
                      className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-300">
                    Semester
                  </label>
                  <select
                    id="teacherSemester"
                    name="teacherSemester"
                    value={formData.teacherSemester}
                    onChange={handleChange}
                    disabled={!finalTeacherCourse}
                    className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                  >
                    <option value="">
                      {finalTeacherCourse ? 'Select semester' : 'Select course first'}
                    </option>
                    {teacherSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.teacherSemester ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-300">
                      Subjects (multi-select)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => {
                          const all = availableTeacherSubjects;
                          const current = prev.teacherSubjects;
                          const next =
                            current.length === all.length ? [] : all;
                          return { ...prev, teacherSubjects: next };
                        })
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
                        No subjects available
                      </span>
                    )}
                    {availableTeacherSubjects.map((subj) => {
                      const checked = formData.teacherSubjects.includes(subj);
                      return (
                        <label
                          key={subj}
                          className={`subject-chip flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border cursor-pointer ${
                            checked
                              ? 'bg-accent/20 border-accent text-emerald-200'
                              : 'bg-primary/70 border-white/15 text-gray-300'
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
                            className="hidden"
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
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add custom subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="flex-1 rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const subjectName = newSubject.trim();
                        if (!subjectName || !formData.teacherSemester) return;

                        try {
                          await api.post('/subjects', {
                            name: subjectName,
                            course: finalTeacherCourse,
                            semester: formData.teacherSemester
                          });

                          setAvailableTeacherSubjects((prev) =>
                            prev.includes(subjectName) ? prev : [...prev, subjectName]
                          );
                          setFormData((prev) => ({
                            ...prev,
                            teacherSubjects: prev.teacherSubjects.includes(subjectName)
                              ? prev.teacherSubjects
                              : [...prev.teacherSubjects, subjectName]
                          }));
                          setNewSubject('');
                        } catch (error) {
                          console.error('Add custom subject error:', error);
                          const msg =
                            error?.response?.data?.error ||
                            error?.response?.data?.message ||
                            'Failed to add subject';
                          alert(msg);
                        }
                      }}
                      className="rounded-xl bg-accent text-secondary px-4 py-2.5 text-sm font-semibold hover:bg-emerald-400"
                    >
                      Add Subject
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Select semester to choose subjects
                </p>
              )}
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
                      {courses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {formData.course === 'Other' && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-300">
                      Custom course
                    </label>
                    <input
                      type="text"
                      placeholder="Enter custom course"
                      value={formData.customCourse}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customCourse: e.target.value
                        }))
                      }
                      className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                    />
                  </div>
                )}
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
                    disabled={!finalCourse}
                    className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                  >
                    <option value="">
                      {finalCourse ? 'Select semester' : 'Select course first'}
                    </option>
                    {studentSemesters.map((sem) => (
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

                {formData.semester ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-gray-300">
                        Subjects (multi-select)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => {
                            const all = availableSubjects;
                            const current = prev.subjects;
                            const next =
                              current.length === all.length ? [] : all;
                            return { ...prev, subjects: next };
                          })
                        }
                        disabled={availableSubjects.length === 0}
                        className="text-[11px] px-2 py-1 rounded-full border border-accent/60 text-accent hover:bg-accent/10 disabled:opacity-50"
                      >
                        Select all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSubjects.length === 0 && (
                        <span className="text-xs text-gray-500">
                          No subjects available
                        </span>
                      )}
                      {availableSubjects.map((subj) => {
                        const checked = formData.subjects.includes(subj);
                        return (
                          <label
                            key={subj}
                            className={`subject-chip flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border cursor-pointer ${
                              checked
                                ? 'bg-accent/20 border-accent text-emerald-200'
                                : 'bg-primary/70 border-white/15 text-gray-300'
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
                              className="hidden"
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
                ) : (
                  <p className="text-xs text-gray-400">
                    Select semester to choose subjects
                  </p>
                )}
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