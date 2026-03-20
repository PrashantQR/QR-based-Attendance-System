import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const ExamSummary = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const location = useLocation();

  const initialSummary = location.state || null;
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    if (summary) return;
    if (!testId) return;

    try {
      const raw = localStorage.getItem(`exam_summary_${String(testId)}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSummary(parsed || null);
    } catch (_) {}
  }, [summary, testId]);

  const counts = useMemo(() => {
    const totalQuestions = Number(summary?.totalQuestions || 0);
    const attempted = Number(summary?.attempted || 0);
    const notAttempted = Number(summary?.notAttempted || 0);
    const reviewCount = Number(summary?.reviewCount || 0);

    return { totalQuestions, attempted, notAttempted, reviewCount };
  }, [summary]);

  if (!summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-2">
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white">Exam Summary</h2>
          <p className="text-sm text-gray-400 mt-2">
            Summary not found. Please submit again or go to the result page.
          </p>
          <div className="mt-5 flex gap-2 flex-wrap">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
              onClick={() => navigate(`/student/exam/result/${testId}`)}
            >
              View Result
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-semibold"
              onClick={() => navigate('/student/exam')}
            >
              Back to Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Exam Summary
          </h2>
          <p className="text-sm text-gray-400 mt-1">Test ID: {testId}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/student/exam/result/${testId}`)}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
          >
            View Result
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/exam')}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-semibold"
          >
            Back to Exam
          </button>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400">Total Questions</p>
            <p className="text-2xl font-semibold text-white">
              {counts.totalQuestions}
            </p>
          </div>

          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400">Attempted Questions</p>
            <p className="text-2xl font-semibold text-emerald-300">
              {counts.attempted}
            </p>
          </div>

          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400">Not Attempted</p>
            <p className="text-2xl font-semibold text-rose-300">
              {counts.notAttempted}
            </p>
          </div>

          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400">Marked for Review</p>
            <p className="text-2xl font-semibold text-yellow-200">
              {counts.reviewCount}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-4 text-center">
          Submit received. Result will appear here after teacher publishes.
        </p>
      </div>
    </div>
  );
};

export default ExamSummary;

