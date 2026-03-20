import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ExamInstructions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Exam Instructions
        </h2>
        <p className="text-sm text-gray-400 mt-1">Test ID: {testId}</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
        <ul className="space-y-2 text-sm text-gray-200">
          <li>1) No tab switching while exam is running.</li>
          <li>2) Auto submit when timer ends.</li>
          <li>3) One correct answer per question.</li>
          <li>4) You must submit only once.</li>
        </ul>

        <div className="mt-5 flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-emerald-400"
            id="agree-exam"
          />
          <label htmlFor="agree-exam" className="text-sm text-gray-300">
            I agree to follow the exam rules.
          </label>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={!agreed}
            onClick={() => navigate(`/student/exam/start/${testId}`)}
            className={`px-5 py-2 rounded-lg font-semibold ${
              agreed
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-900'
                : 'bg-white/5 text-gray-400 cursor-not-allowed'
            }`}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructions;

