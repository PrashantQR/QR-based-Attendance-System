import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const ratingLabels = {
  1: 'Bad',
  2: 'OK',
  3: 'Good',
  4: 'Best',
  5: 'Excellent'
};

const courseOptions = [
  'MERN Stack',
  'Data Structures',
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Software Engineering'
];

const EvaluateInstructor = () => {
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState({
    instructorId: '',
    course: '',
    teachingQuality: 5,
    communication: 5,
    interaction: 5,
    subjectKnowledge: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/auth/teachers', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setInstructors(response.data.data || []);
      } catch (err) {
        console.error('Error fetching instructors:', err);
        setInstructors([]);
      }
    };

    fetchInstructors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    if (!form.instructorId || !form.course) {
      setError('Please select both instructor and course before submitting evaluation.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.post('/evaluation/submit', form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage('Evaluation submitted successfully.');
      setForm((prev) => ({
        ...prev,
        course: '',
        comment: ''
      }));
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError(
        err.response?.data?.message || 'An error occurred while submitting evaluation.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingControl = (name, label) => (
    <div className="mb-3">
      <label className="form-label d-block">{label}</label>
      <div className="d-flex align-items-center flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`btn btn-sm me-2 mb-2 ${
              form[name] === value ? 'btn-primary' : 'btn-outline-secondary'
            }`}
            onClick={() => handleRatingChange(name, value)}
          >
            {value} - {ratingLabels[value]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">Instructor Evaluation</h2>
          <p className="text-white-50">
            Share anonymous feedback about your instructor. Your identity will not be shown to teachers.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="instructorId" className="form-label">
                  Instructor
                </label>
                <select
                  id="instructorId"
                  name="instructorId"
                  className="form-select"
                  value={form.instructorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="course" className="form-label">
                  Course
                </label>
                <select
                  id="course"
                  name="course"
                  className="form-select"
                  value={form.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderRatingControl('teachingQuality', 'Teaching Quality')}
            {renderRatingControl('communication', 'Communication')}
            {renderRatingControl('interaction', 'Class Interaction')}
            {renderRatingControl('subjectKnowledge', 'Subject Knowledge')}

            <div className="mb-3">
              <label htmlFor="comment" className="form-label">
                Comment (optional)
              </label>
              <textarea
                id="comment"
                name="comment"
                className="form-control"
                rows="3"
                value={form.comment}
                onChange={handleChange}
                placeholder="Share any feedback you would like to give"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvaluateInstructor;

