import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

const ExamHome = () => {
  const navigate = useNavigate();
  const [hasActive, setHasActive] = useState(false);
  const [loadingActive, setLoadingActive] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const examOptions = useMemo(
    () => [
      {
        label: 'Scan Exam QR',
        icon: '📷',
        onClick: () => navigate('/student/exam/scan')
      },
      {
        label: 'Resume Active Test',
        icon: '▶️',
        onClick: () => navigate('/student/exam/active'),
        disabled: !hasActive
      },
      {
        label: 'View Instructions',
        icon: '📄',
        onClick: () => setShowInstructions(true)
      }
    ],
    [hasActive, navigate]
  );

  useEffect(() => {
    const fetchActive = async () => {
      setLoadingActive(true);
      try {
        const res = await api.get('/exam/active');
        const data = res.data?.data;
        setHasActive(Boolean(data));
      } catch (error) {
        console.error('Fetch active attempt error:', error);
        toast.error('Failed to load active test');
      } finally {
        setLoadingActive(false);
      }
    };
    fetchActive();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Exam
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Start your test using the teacher’s QR.
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
        <div className="grid gap-3">
          {examOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.onClick}
              disabled={opt.disabled || loadingActive}
              className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                opt.disabled || loadingActive
                  ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{opt.icon}</span>
                <span className="font-semibold">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showInstructions && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInstructions(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg bg-slate-900/95 border border-slate-700 rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-3">
              Exam Instructions
            </h3>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>No tab switching.</li>
              <li>Timer starts after you start the exam.</li>
              <li>One correct answer per question.</li>
              <li>Your answers will be submitted automatically on timeout.</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamHome;

