import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ExamTake = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const { testId, title, description, durationMinutes, startedAt, questions } = state;

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60 || 0);

  useEffect(() => {
    if (!testId || !Array.isArray(questions)) {
      navigate('/student');
    }
  }, [testId, questions, navigate]);

  useEffect(() => {
    if (!durationMinutes || !startedAt) return;
    const start = new Date(startedAt).getTime();
    const end = start + durationMinutes * 60 * 1000;

    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handleSubmit(true);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes, startedAt]);

  const formattedTime = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [timeLeft]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (auto = false) => {
    if (!testId || !Array.isArray(questions)) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q._id,
        selected: answers[q._id] || null
      }));
      const res = await api.post('/exam/submit', {
        testId,
        answers: payloadAnswers
      });
      toast.success(res.data?.message || 'Exam submitted');
      try {
        localStorage.setItem('last_exam_test_id', String(testId));
      } catch (_) {}
      navigate(`/student/exam/result/${testId}`, { replace: true });
    } catch (error) {
      console.error('Exam submit error:', error);
      const message = error.response?.data?.message || 'Failed to submit exam';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!testId || !Array.isArray(questions)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {title || 'Exam'}
          </h2>
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Time Remaining</p>
          <p className="text-xl font-semibold text-emerald-400">
            {formattedTime}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        {questions.map((q, idx) => (
          <div
            key={q._id}
            className="border border-slate-700 rounded-lg p-4 mb-3 bg-slate-950/60"
          >
            <p className="text-sm text-gray-100 mb-3">
              <span className="font-semibold mr-2">
                Q{idx + 1}.
              </span>
              {q.text}
            </p>
            <div className="space-y-2 text-sm text-gray-200">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optionText = q[`option${optKey}`];
                if (!optionText) return null;
                return (
                  <label
                    key={optKey}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={q._id}
                      value={optKey}
                      checked={answers[q._id] === optKey}
                      onChange={(e) => handleChange(q._id, e.target.value)}
                      className="h-3 w-3 accent-emerald-500"
                    />
                    <span className="text-xs md:text-sm">
                      <span className="font-semibold mr-1">{optKey}.</span>
                      {optionText}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
};

export default ExamTake;

