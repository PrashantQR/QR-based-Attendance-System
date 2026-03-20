import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

const formatTime = (seconds) => {
  const s = Math.max(0, Number(seconds || 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const ExamRunner = ({
  testId,
  testTitle,
  subjectName,
  durationMinutes,
  startedAt,
  questions,
  initialAnswers = {}
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({ ...initialAnswers }));
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    Number(durationMinutes || 0) * 60
  );
  const [submitting, setSubmitting] = useState(false);

  const hasSubmittedRef = useRef(false);
  const violationsRef = useRef(0);
  const submittedOnceRef = useRef(false);

  // Keep latest answers/questions inside callbacks (timer/anti-cheat)
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const endTimeMs = useMemo(() => {
    const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
    return startMs + Number(durationMinutes || 0) * 60 * 1000;
  }, [startedAt, durationMinutes]);

  const currentQuestion = questions?.[currentIndex];

  const totalQuestions = Array.isArray(questions) ? questions.length : 0;
  const answeredCount = useMemo(() => {
    if (!Array.isArray(questions)) return 0;
    let c = 0;
    for (const q of questions) {
      if (answers[q._id]) c += 1;
    }
    return c;
  }, [questions, answers]);

  useEffect(() => {
    const id = setInterval(() => {
      if (hasSubmittedRef.current) return;
      const now = Date.now();
      const remaining = Math.floor((endTimeMs - now) / 1000);
      setTimeLeftSeconds(Math.max(0, remaining));
      if (remaining <= 0) {
        submitExam(true);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimeMs]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        violationsRef.current += 1;
        toast.warn('Tab switching detected (anti-cheat)');
        if (violationsRef.current >= 3) {
          toast.warn('Submitting due to repeated tab switching...');
          submitExam(false, true);
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitExam = async (auto, silentAntiCheat = false) => {
    if (hasSubmittedRef.current) return;
    if (submittedOnceRef.current) return;
    submittedOnceRef.current = true;
    hasSubmittedRef.current = true;

    setSubmitting(true);
    try {
      const payloadAnswers = (questionsRef.current || []).map((q) => ({
        questionId: q._id,
        selected: answersRef.current[q._id] || null
      }));

      if (!auto && !silentAntiCheat) {
        toast.info('Submitting...');
      }

      await api.post('/exam/submit', {
        testId,
        answers: payloadAnswers
      });

      toast.success(auto ? 'Time up! Exam submitted' : 'Exam submitted');
      navigate(`/student/exam/result/${testId}`, { replace: true });
    } catch (error) {
      console.error('Exam submit error:', error);
      toast.error(
        error.response?.data?.message || 'An error occurred while submitting'
      );
      // allow retry if submission failed
      hasSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const onOptionChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const progressPercent = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {testTitle || 'Exam'}
          </h2>
          {subjectName ? (
            <p className="text-sm text-gray-400 mt-1">Subject: {subjectName}</p>
          ) : null}
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Time Remaining</p>
          <p className="text-2xl font-semibold text-emerald-400">
            {formatTime(timeLeftSeconds)}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
            <span>Answered: {answeredCount} / {totalQuestions}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-2 bg-emerald-400 rounded transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {totalQuestions > 0 && currentQuestion && (
          <div className="space-y-4">
            <div className="bg-[#0f172a] border border-white/5 p-4 rounded-lg">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-sm text-gray-100">
                  <span className="font-semibold mr-2">
                    Q{currentIndex + 1}.
                  </span>
                  {currentQuestion.text}
                </h3>

                <div className="text-[11px] text-gray-400">
                  Question {currentIndex + 1} of {totalQuestions}
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const value = optKey;
                  const optionText = currentQuestion[`option${optKey}`];
                  if (!optionText) return null;
                  const checked = answers[currentQuestion._id] === value;
                  return (
                    <label
                      key={optKey}
                      className={`p-2 rounded border cursor-pointer transition ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
                          : 'border-white/10 bg-white/0 text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQuestion._id}`}
                        value={value}
                        checked={checked}
                        onChange={(e) => onOptionChange(currentQuestion._id, e.target.value)}
                        className="mr-2 accent-emerald-400"
                      />
                      <span className="font-semibold mr-2">{optKey}.</span>
                      {optionText}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentIndex === 0 || submitting}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentIndex === totalQuestions - 1 || submitting}
                  onClick={() =>
                    setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))
                  }
                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-60"
                >
                  Next
                </button>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => submitExam(false)}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">Question Palette</div>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const answered = Boolean(answers[q._id]);
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
                        isActive
                          ? 'bg-emerald-400/15 border-emerald-300 text-emerald-200'
                          : answered
                          ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                          : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                      aria-label={`Go to question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamRunner;

