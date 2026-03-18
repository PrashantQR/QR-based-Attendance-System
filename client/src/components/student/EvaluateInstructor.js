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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-200">{label}</label>
        <span className="text-sm text-gray-400">
          {form[name]} – {ratingLabels[form[name]]}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = form[name] === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleRatingChange(name, value)}
              className={[
                'px-3 py-2 rounded-xl text-sm font-semibold border transition',
                active
                  ? 'bg-accent/20 border-accent/40 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              ].join(' ')}
            >
              {value}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-400">
        1–5: {Object.entries(ratingLabels).map(([k, v]) => `${k}=${v}`).join(', ')}
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">Instructor Evaluation</h2>
        <p className="text-sm text-gray-400 mt-1">
          Share anonymous feedback about your instructor. Your identity will not be shown to teachers.
        </p>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10">
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-200 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="instructorId" className="block text-sm font-semibold text-gray-200 mb-1">
                Instructor
              </label>
              <select
                id="instructorId"
                name="instructorId"
                className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
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

            <div>
              <label htmlFor="course" className="block text-sm font-semibold text-gray-200 mb-1">
                Course
              </label>
              <select
                id="course"
                name="course"
                className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
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

          <div className="flex flex-col gap-2">
            <label htmlFor="comment" className="text-sm font-semibold text-gray-200">
              Comment (optional)
            </label>
            <textarea
              id="comment"
              name="comment"
              className="w-full min-h-[100px] rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
              rows={4}
              value={form.comment}
              onChange={handleChange}
              placeholder="Share any feedback you would like to give"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 inline-flex items-center justify-center rounded-xl bg-accent text-secondary px-4 py-3 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EvaluateInstructor;

