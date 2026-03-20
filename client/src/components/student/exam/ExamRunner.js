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
  const [markedForReview, setMarkedForReview] = useState([]);
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
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
    const qid = currentQuestion?._id;
    if (!qid) return;
    const key = String(qid);
    setVisitedQuestions((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

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

  const handleSaveAnswer = () => {
    // Answers are already stored on selection in this UI;
    // this button is for UX parity with real exam platforms.
    // Keep UX clean: no toast on every click.
    setShowSavedIndicator(true);
    window.setTimeout(() => setShowSavedIndicator(false), 800);
  };

  const handleMarkForReview = () => {
    const qid = currentQuestion?._id;
    if (!qid) return;
    const key = String(qid);
    setMarkedForReview((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const progressPercent = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const currentQuestionId = currentQuestion?._id ? String(currentQuestion._id) : '';

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

        <div className="text-center md:text-right md:mt-0 mt-2">
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
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
                              disabled={submitting || !currentQuestion}
                              onClick={handleMarkForReview}
                              className={`px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-60 ${
                                markedForReview.includes(currentQuestionId)
                                  ? 'border-yellow-300/60 bg-yellow-400/15 text-yellow-200 hover:bg-yellow-400/20'
                                  : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                              }`}
                            >
                              {markedForReview.includes(currentQuestionId)
                                ? 'Unmark Review'
                                : 'Mark for Review'}
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

                            <button
                              type="button"
                              disabled={submitting || !currentQuestion}
                              onClick={handleSaveAnswer}
                              className="px-4 py-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm font-medium hover:bg-emerald-400/20 disabled:opacity-60"
                            >
                              Save Answer
                            </button>
                            {showSavedIndicator && (
                              <span className="text-xs text-emerald-200 ml-2 whitespace-nowrap">
                                ✔ Saved
                              </span>
                            )}
              </div>

                          <div className="flex items-center gap-3 justify-center sm:justify-end w-full sm:w-auto">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setShowSubmitConfirm(true)}
                              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-semibold disabled:opacity-60"
                            >
                              {submitting ? 'Submitting...' : 'Submit Exam'}
                            </button>
                          </div>
            </div>

                        {showSubmitConfirm && (
                          <div
                            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                            role="dialog"
                            aria-modal="true"
                          >
                            <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-xl p-5 space-y-4">
                              <h3 className="text-white font-semibold text-lg">
                                Confirm Submit
                              </h3>
                              <p className="text-sm text-gray-300">
                                Are you sure you want to submit this exam? You
                                cannot change answers after submitting.
                              </p>
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => setShowSubmitConfirm(false)}
                                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => {
                                    setShowSubmitConfirm(false);
                                    submitExam(false);
                                  }}
                                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-semibold disabled:opacity-60"
                                >
                                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

            <div>
              <div className="text-xs text-gray-400 mb-2">Question Palette</div>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                              const qid = String(q._id);
                              const isVisited = Boolean(visitedQuestions[qid]);
                              const answered = Boolean(answers[q._id]);
                              const isMarked = markedForReview.includes(qid);
                  const isActive = idx === currentIndex;

                              const paletteClass = (() => {
                                if (!isActive && !isVisited) {
                                  return 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5';
                                }
                                if (!isActive && isMarked) {
                                  return 'bg-yellow-400/15 border-yellow-300 text-yellow-200 hover:bg-yellow-400/20';
                                }
                                if (!isActive && answered) {
                                  return 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10';
                                }
                                if (!isActive && isVisited && !answered) {
                                  return 'bg-rose-500/15 border-rose-400 text-rose-200 hover:bg-rose-500/20';
                                }
                                return '';
                              })();

                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                                  className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
                                    isActive
                                      ? 'bg-emerald-400/15 border-emerald-300 text-emerald-200'
                                      : paletteClass
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

