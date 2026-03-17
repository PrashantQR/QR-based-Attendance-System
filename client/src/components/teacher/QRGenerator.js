import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaQrcode, FaCopy, FaDownload, FaClock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { academicData } from '../../constants/academicData';

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

const QRGenerator = () => {
  const { user, isAuthenticated, token } = useAuth();
  const teacherSubjects = Array.isArray(user?.subjects) ? user.subjects : [];
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    className: '',
    course: '',
    customCourse: '',
    semester: '',
    subject: '',
    validityMinutes: 10
  });
  const [generatedQR, setGeneratedQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [rawSubjects, setRawSubjects] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'course') {
        return {
          ...prev,
          course: value,
          customCourse: '',
          semester: '',
          subject: ''
        };
      }
      if (name === 'semester') {
        return {
          ...prev,
          semester: value,
          subject: ''
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

  const qrSemesters = useMemo(() => {
    if (!finalCourse) return [];
    return courseSemesters[finalCourse] || defaultSemesters;
  }, [finalCourse]);

  const availableSubjects = useMemo(() => {
    if (!finalCourse || !formData.semester) return [];
    if (rawSubjects.length === 0) return [];
    // Optionally intersect with teacherSubjects if they are defined
    if (teacherSubjects.length === 0) return rawSubjects;
    return rawSubjects.filter((s) => teacherSubjects.includes(s));
  }, [finalCourse, formData.semester, rawSubjects, teacherSubjects]);

  // Load courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data?.success) {
          const dbCourses = (res.data.data || []).map((c) => c.name);
          setCourses([...new Set([...defaultCourses, ...dbCourses])]);
        }
      } catch (e) {
        console.error('Error fetching courses', e);
        setCourses(defaultCourses);
      }
    };
    fetchCourses();
  }, []);

  // Load subjects whenever course + semester selected (standard + DB-backed)
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!finalCourse || !formData.semester) {
        setRawSubjects([]);
        return;
      }
      try {
        const res = await api.get('/subjects', {
          params: { course: finalCourse, semester: formData.semester }
        });
        const standardSubjects =
          academicData[finalCourse]?.[formData.semester] || [];

        let dbSubjects = [];
        if (res.data?.success) {
          dbSubjects = (res.data.data || []).map((s) => s.name);
        }

        const merged = [...new Set([...standardSubjects, ...dbSubjects])];
        setRawSubjects(merged);
      } catch (e) {
        console.error('Error fetching subjects', e);
        const fallback =
          academicData[finalCourse]?.[formData.semester] || [];
        setRawSubjects(fallback);
      }
    };
    fetchSubjects();
  }, [finalCourse, formData.semester]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) {
      toast.error('Enter a course name');
      return;
    }
    try {
      const res = await api.post('/courses', { name: newCourseName.trim() });
      if (res.data?.success) {
        toast.success('Course added');
        setCourses((prev) => [...prev, res.data.data.name]);
        setNewCourseName('');
      }
    } catch (error) {
      console.error('Create course error', error);
      const message = error.response?.data?.error || 'Failed to create course';
      toast.error(message);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !formData.semester || !finalCourse) {
      toast.error('Enter subject name, course and semester');
      return;
    }
    try {
      const res = await api.post('/subjects', {
        name: newSubject.trim(),
        course: finalCourse,
        semester: formData.semester
      });
      if (res.data?.success) {
        toast.success('Subject added');
        if (finalCourse === res.data.data.course && formData.semester === res.data.data.semester) {
          setRawSubjects((prev) => [...prev, res.data.data.name]);
        }
        setNewSubject('');
      }
    } catch (error) {
      console.error('Create subject error', error);
      const message = error.response?.data?.error || 'Failed to create subject';
      toast.error(message);
    }
  };

  const generateQR = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check authentication
    if (!isAuthenticated || !token) {
      toast.error('You must be logged in to generate QR codes');
      setLoading(false);
      return;
    }

    // Check if user is a teacher
    if (user?.role !== 'teacher') {
      toast.error('Only teachers can generate QR codes');
      setLoading(false);
      return;
    }

    if (!formData.course) {
      toast.error('Please select a course');
      setLoading(false);
      return;
    }

    if (formData.course === 'Other' && !formData.customCourse.trim()) {
      toast.error('Please enter a custom course');
      setLoading(false);
      return;
    }

    if (!formData.semester) {
      toast.error('Please select a semester');
      setLoading(false);
      return;
    }

    if (!formData.subject) {
      toast.error('Please select a subject');
      setLoading(false);
      return;
    }

    console.log('Generating QR code with token:', token ? 'Present' : 'Missing');
    console.log('User:', user);
    try {
      const payload = {
        description: formData.description,
        location: formData.location,
        course: finalCourse,
        semester: formData.semester,
        className: formData.className,
        subject: formData.subject,
        validityMinutes: formData.validityMinutes
      };

      const response = await api.post('/qr/generate', payload);
      setGeneratedQR(response.data.data);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('QR generation error:', error);
      const message = error.response?.data?.message || 'Failed to generate QR code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR.code);
      toast.success('QR Code copied to clipboard!');
    }
  };

  const downloadQR = () => {
    if (generatedQR) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `qr-code-${generatedQR.code}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = generatedQR.qrCodeImage;
    }
  };

  // Debug authentication state
  console.log('QR Generator - Auth State:', {
    isAuthenticated,
    user,
    token: token ? 'Present' : 'Missing',
    userRole: user?.role
  });

  // Show loading if authentication is still being checked
  if (!isAuthenticated && !user) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-white">Checking authentication...</p>
      </div>
    );
  }

  // Show error if user is not a teacher
  if (user && user.role !== 'teacher') {
    return (
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-danger">Access Denied</h3>
              <p>Only teachers can generate QR codes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">Generate QR Code</h2>
          <p className="text-white-50">Create a new QR code for student attendance</p>
        </div>
      </div>

      {/* Manage Courses & Subjects (teacher-side management) */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-2">Manage Courses</h5>
              <form className="d-flex gap-2" onSubmit={handleCreateCourse}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add new course (e.g., MCA)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                />
                <button type="submit" className="btn btn-outline-primary btn-sm">
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-2">Manage Subjects</h5>
              <form className="row g-2" onSubmit={handleCreateSubject}>
                <div className="col-12">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Subject name (e.g., Data Structures)"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <select
                    className="form-select"
                    value={formData.course}
                    onChange={handleChange}
                  >
                    <option value="">Course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.course === 'Other' && (
                  <div className="col-7">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter custom course"
                      value={formData.customCourse}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customCourse: e.target.value
                        }))
                      }
                    />
                  </div>
                )}
                <div className="col-4">
                  <select
                    className="form-select"
                    value={formData.semester}
                    onChange={handleChange}
                    disabled={!finalCourse}
                  >
                    <option value="">
                      {finalCourse ? 'Select Semester' : 'Select course first'}
                    </option>
                    {qrSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-3 d-grid">
                  <button type="submit" className="btn btn-outline-primary btn-sm">
                    Add Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">QR Code Settings</h5>
              <form onSubmit={generateQR}>
                <div className="mb-3">
                  <label className="form-label">Teacher</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.name || ''}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Morning Class Attendance"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="location" className="form-label">
                    Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Room 101"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="className" className="form-label">
                    Department / Class
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="className"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    placeholder="e.g., MCA Year 1"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Course</label>
                  <select
                    id="course"
                    name="course"
                    className="form-select"
                    value={formData.course}
                    onChange={handleChange}
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.course === 'Other' && (
                  <div className="mb-3">
                    <label className="form-label">Custom Course</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter custom course"
                      value={formData.customCourse}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customCourse: e.target.value
                        }))
                      }
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Semester</label>
                  <select
                    id="semester"
                    name="semester"
                    className="form-select"
                    value={formData.semester}
                    onChange={handleChange}
                    disabled={!finalCourse}
                  >
                    <option value="">
                      {finalCourse ? 'Select Semester' : 'Select course first'}
                    </option>
                    {qrSemesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    className="form-select"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={!formData.semester || availableSubjects.length === 0}
                  >
                    <option value="">
                      {!formData.semester
                        ? 'Select semester first'
                        : availableSubjects.length === 0
                        ? 'No subjects available'
                        : 'Select subject'}
                    </option>
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="validityMinutes" className="form-label">
                    Validity (minutes)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaClock />
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      id="validityMinutes"
                      name="validityMinutes"
                      value={formData.validityMinutes}
                      onChange={handleChange}
                      min="1"
                      max="60"
                    />
                  </div>
                  <small className="text-muted">
                    QR code will expire after this time
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <FaQrcode className="me-2" />
                      Generate QR Code
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Generated QR Code</h5>
              
              {generatedQR ? (
                <div className="text-center">
                  <div className="qr-container mb-3">
                    <img 
                      src={generatedQR.qrCodeImage} 
                      alt="QR Code" 
                      className="img-fluid"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <strong>Code:</strong> {generatedQR.code}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Expires:</strong> {new Date(generatedQR.expiresAt).toLocaleString()}
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-primary"
                      onClick={copyToClipboard}
                    >
                      <FaCopy className="me-2" />
                      Copy Code
                    </button>
                    <button
                      className="btn btn-outline-success"
                      onClick={downloadQR}
                    >
                      <FaDownload className="me-2" />
                      Download QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted">
                  <FaQrcode size={100} className="mb-3" />
                  <p>Generate a QR code to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {generatedQR && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">QR Code Details</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Description:</strong> {generatedQR.description}</p>
                    <p><strong>Location:</strong> {generatedQR.location}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Course/Subject:</strong> {generatedQR.course}</p>
                    <p><strong>Generated:</strong> {new Date(generatedQR.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator; 