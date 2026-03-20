import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ExamResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!testId) {
        navigate('/student');
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/results/student/test/${testId}`);

        if (!res.data?.success) {
          setPending({
            message: res.data?.message || 'Result not declared yet',
            test: res.data?.data?.test || null
          });
          setData(null);
        } else {
          setPending(null);
          setData(res.data?.data || null);
        }
      } catch (error) {
        console.error('Exam result fetch error:', error);
        toast.error(
          error.response?.data?.message || 'Failed to fetch exam result'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [testId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading result…</p>
        </div>
      </div>
    );
  }

  if (pending) {
    const test = pending.test || {};
    const attempts = test.attemptCount ?? 0;
    const isExpired = Boolean(test.isExpired);
    const statusLabel = isExpired ? 'Expired' : 'Active';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Exam Result</h2>
            <p className="text-sm text-gray-400">Test ID: {testId}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student/exam')}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
          >
            Back to Exam
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 space-y-3">
          {Number(attempts) === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-yellow-300">
                ⚠️ You have not attempted this test yet
              </h3>
              <p className="text-sm text-gray-400">
                Subject: <b className="text-white">{test.subjectName || '—'}</b> •
                Status: <b className="text-white">{statusLabel}</b>
              </p>
              {isExpired ? (
                <p className="text-sm text-rose-300">⛔ Test expired. You can no longer attempt.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/student/exam/scan')}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold"
                >
                  Start Test
                </button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-yellow-300">
                🕒 Result will be declared soon
              </h3>
              <p className="text-sm text-gray-400">
                Subject: <b className="text-white">{test.subjectName || '—'}</b>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Exam Result</h2>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">Result not available.</p>
        </div>
      </div>
    );
  }

  const { score, percentage, pass, questions } = data;
  const correctCount = Array.isArray(questions)
    ? questions.filter(
        (q) =>
          q.correctAnswer && q.studentAnswer && q.studentAnswer === q.correctAnswer
      ).length
    : 0;
  const wrongCount = Array.isArray(questions) ? questions.length - correctCount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Exam Result
          </h2>
          <p className="text-sm text-gray-400">
            Test ID: {testId}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/exam')}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
        >
          Back to Exam
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Score</p>
          <p className="text-2xl font-semibold text-white">{score}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Percentage</p>
          <p className="text-2xl font-semibold text-white">
            {percentage}%
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Status</p>
          <p
            className={`text-2xl font-semibold ${
              pass ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {pass ? 'PASS' : 'FAIL'}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-white">
            Question-wise Result
          </h3>
          <div className="text-xs text-gray-400">
            Correct: <b className="text-white">{correctCount}</b> • Wrong:{' '}
            <b className="text-white">{wrongCount}</b>
          </div>
        </div>

        {Array.isArray(questions) && questions.length > 0 ? (
          questions.map((q, index) => {
            const optionLetters = ['A', 'B', 'C', 'D'];
            return (
              <div
                key={`${q.question}-${index}`}
                className="bg-[#0f172a] border border-white/5 p-4 rounded-lg mb-3"
              >
                <h3 className="font-semibold text-white mb-3">
                  Q{index + 1}. {q.question}
                </h3>

                <div className="grid gap-2 text-sm">
                  {q.options?.map((opt, i) => {
                    const optionLabel = optionLetters[i];
                    const isCorrect = q.correctAnswer === optionLabel;
                    const isSelected = q.studentAnswer === optionLabel;

                    return (
                      <div
                        key={`${optionLabel}-${index}`}
                        className={`p-2 rounded border ${
                          isCorrect
                            ? 'bg-green-600/20 border-green-500 text-emerald-200'
                            : ''
                        } ${
                          isSelected && !isCorrect
                            ? 'bg-red-600/20 border-red-500 text-rose-200'
                            : ''
                        }`}
                      >
                        {optionLabel}. {opt}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Your Answer: <b className="text-white">{q.studentAnswer || '—'}</b> |
                  Correct: <b className="text-white">{q.correctAnswer || '—'}</b>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-400">No question-wise data available.</p>
        )}
      </div>
    </div>
  );
};

export default ExamResult;

