import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ExamResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!testId) {
        navigate('/student');
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/exam/result/${testId}`);
        if (!res.data?.success) {
          setPending(true);
        } else {
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

  if (pending || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Exam Result</h2>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">
            Result not declared yet. Please check again later.
          </p>
        </div>
      </div>
    );
  }

  const { score, percentage, pass, questions } = data;

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
          onClick={() => navigate('/student')}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
        >
          Back to Dashboard
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
        <h3 className="text-sm font-semibold text-white mb-2">
          Question-wise Answers
        </h3>
        {Array.isArray(questions) && questions.length > 0 ? (
          questions.map((q, idx) => (
            <div
              key={q.questionId}
              className="border border-slate-700 rounded-lg p-4 mb-3 bg-slate-950/60"
            >
              <p className="text-sm text-gray-100 mb-2">
                <span className="font-semibold mr-2">
                  Q{idx + 1}.
                </span>
                {q.text}
              </p>
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-emerald-300">
                  Correct:
                </span>{' '}
                {q.correctAnswer || '—'}
              </p>
              <p className="text-xs text-gray-300">
                <span className="font-semibold text-sky-300">
                  Your answer:
                </span>{' '}
                {q.selected || 'Not answered'}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">
            No question-level data available.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamResult;

