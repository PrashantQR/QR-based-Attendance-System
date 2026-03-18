import React, { useEffect, useState, useMemo } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const ratingLabels = {
  1: 'Bad',
  2: 'OK',
  3: 'Good',
  4: 'Best',
  5: 'Excellent'
};

const EvaluateInstructor = ({ embedded = false, onClose } = {}) => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const enrolledSubjects = useMemo(() => {
    return Array.isArray(user?.subjects) ? user.subjects : [];
  }, [user?.subjects]);

  const [form, setForm] = useState({
    instructorId: '',
    subject: '',
    teachingQuality: 0,
    communication: 0,
    interaction: 0,
    subjectKnowledge: 0,
    doubtSolving: 0,
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

    if (!form.instructorId || !form.subject) {
      setError('Please select both instructor and subject before submitting evaluation.');
      setSubmitting(false);
      return;
    }

    // Validate all required ratings (1-5)
    const requiredRatings = [
      ['teachingQuality', form.teachingQuality],
      ['communication', form.communication],
      ['interaction', form.interaction],
      ['subjectKnowledge', form.subjectKnowledge],
      ['doubtSolving', form.doubtSolving]
    ];
    const invalid = requiredRatings.find(([, v]) => !Number.isInteger(v) || v < 1 || v > 5);
    if (invalid) {
      setError('Please select ratings for all categories (1–5).');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Anonymous feedback: do not send student identity
      const payload = {
        teacherId: form.instructorId,
        subject: form.subject,
        ratings: {
          teachingQuality: form.teachingQuality,
          communication: form.communication,
          interaction: form.interaction,
          knowledge: form.subjectKnowledge,
          doubtSolving: form.doubtSolving
        },
        comment: form.comment
      };

      await api.post('/evaluation/submit', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage('Evaluation submitted successfully.');
      setForm({
        instructorId: '',
        subject: '',
        teachingQuality: 0,
        communication: 0,
        interaction: 0,
        subjectKnowledge: 0,
        doubtSolving: 0,
        comment: ''
      });
      onClose?.();
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
          {form[name] ? `${form[name]} – ${ratingLabels[form[name]]}` : 'Select 1–5'}
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
    </div>
  );

  return (
    <div className={embedded ? '' : 'w-full max-w-3xl mx-auto px-4 py-6'}>
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
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-200 mb-1">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full rounded-xl bg-primary/70 border border-white/10 px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70"
                value={form.subject}
                onChange={handleChange}
                required={enrolledSubjects.length > 0}
                disabled={enrolledSubjects.length === 0}
              >
                <option value="">
                  {enrolledSubjects.length === 0 ? 'No subjects assigned' : 'Select Subject'}
                </option>
                {enrolledSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderRatingControl('teachingQuality', 'Teaching Quality')}
          {renderRatingControl('communication', 'Communication')}
          {renderRatingControl('interaction', 'Class Interaction')}
          {renderRatingControl('subjectKnowledge', 'Subject Knowledge')}
          {renderRatingControl('doubtSolving', 'Doubt Solving Ability')}

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

          {/* Sticky submit (helps inside the modal scroll container) */}
          <div
            className={
              embedded
                ? 'sticky bottom-0 bg-[#0f172a] pt-4 mt-2'
                : ''
            }
          >
            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 py-2 rounded-lg font-semibold hover:scale-105 transition disabled:opacity-60"
              disabled={submitting}
            >
              Submit Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluateInstructor;

