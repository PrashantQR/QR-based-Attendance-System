import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

const ExamPreview = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/exam/preview/${testId}`);
        if (!res.data?.success) {
          toast.error(res.data?.message || 'Failed to load preview');
          navigate('/student/exam');
          return;
        }
        setPreview(res.data?.data || null);

        // keep session token available for Start step
        if (state?.token) {
          try {
            localStorage.setItem(
              `exam_session_${String(testId)}`,
              JSON.stringify({ token: state.token, exp: state.exp || null })
            );
          } catch (_) {}
        }
      } catch (error) {
        console.error('Exam preview fetch error:', error);
        toast.error(error.response?.data?.message || 'Failed to load preview');
        navigate('/student/exam');
      } finally {
        setLoading(false);
      }
    };

    if (testId) fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading exam preview…</p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-amber-300">Exam preview unavailable.</p>
      </div>
    );
  }

  const statusLabel = preview.status === 'expired' ? 'Expired' : 'Active';
  const canContinue = preview.status === 'active';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Exam Preview
        </h2>
        <p className="text-sm text-gray-400 mt-1">Test ID: {testId}</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <span className="text-gray-400">Test:</span>{' '}
            <b className="text-white">{preview.testTitle}</b>
          </div>
          <div>
            <span className="text-gray-400">Subject:</span>{' '}
            <b className="text-white">{preview.subjectName || '—'}</b>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>{' '}
            <b className="text-white">{preview.durationMinutes} min</b>
          </div>
          <div>
            <span className="text-gray-400">Questions:</span>{' '}
            <b className="text-white">{preview.totalQuestions}</b>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>{' '}
            <b
              className={
                preview.status === 'active' ? 'text-emerald-300' : 'text-rose-300'
              }
            >
              {statusLabel}
            </b>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          {canContinue ? (
            <button
              type="button"
              onClick={() => navigate(`/student/exam/instructions/${testId}`)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-5 py-2 rounded-lg font-semibold"
            >
              Continue
            </button>
          ) : (
            <div className="text-rose-300 text-sm text-center">
              ⛔ This test is expired. You cannot continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;

