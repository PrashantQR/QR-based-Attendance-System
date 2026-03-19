import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const TestResultDetails = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (!testId) return;

        const role = user?.role;
        if (role === 'teacher') {
          const res = await api.get(`/results/test/${testId}`);
          if (!res.data?.success) {
            setData({ pending: true, message: res.data?.message || '' });
            return;
          }
          setData(res.data?.data || null);
        } else {
          const res = await api.get(`/results/student/test/${testId}`);
          if (!res.data?.success) {
            setData({ pending: true, message: res.data?.message || '' });
            return;
          }
          setData(res.data?.data || null);
        }
      } catch (error) {
        console.error('Test result details fetch error:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch results');
        setData({ pending: true, message: error.response?.data?.message || '' });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [testId, user?.role]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading results…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Test Results</h2>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">
            {data?.message || 'Result not declared'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(user?.role === 'teacher' ? '/teacher/results' : '/student/results')}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
        >
          Back
        </button>
      </div>
    );
  }

  const role = user?.role;

  if (data.pending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              Test Results
            </h2>
            <p className="text-sm text-gray-400">Test ID: {testId}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(role === 'teacher' ? '/teacher/results' : '/student/results')}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
          >
            Back
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">
            {data.message || 'Result not declared'}
          </p>
        </div>
      </div>
    );
  }

  if (role === 'teacher') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              {data.testTitle || 'Test Results'}
            </h2>
            <p className="text-sm text-gray-400">Test ID: {data.testId || testId}</p>
            {data.subjectName ? (
              <p className="text-sm text-gray-400">Subject: {data.subjectName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => navigate('/teacher/results')}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
          >
            Back
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 md:p-6 space-y-3">
          <div className="text-sm text-gray-400">
            Total Questions: {data.totalQuestions ?? '—'}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2 px-3 font-semibold">Student</th>
                  <th className="py-2 px-3 font-semibold">Score</th>
                  <th className="py-2 px-3 font-semibold">%</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data.students) && data.students.length > 0 ? (
                  data.students.map((s) => {
                    const pass = Boolean(s.pass);
                    return (
                      <tr
                        key={String(s.studentId || s.studentName)}
                        className="border-t border-white/5"
                      >
                        <td className="py-3 px-3 text-gray-200">{s.studentName}</td>
                        <td className="py-3 px-3 text-gray-200">
                          {typeof data.totalQuestions === 'number' && data.totalQuestions > 0
                            ? `${s.score}/${data.totalQuestions}`
                            : String(s.score)}
                        </td>
                        <td className="py-3 px-3 text-gray-200">{s.percentage}%</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${
                              pass
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-rose-400/10 text-rose-300'
                            }`}
                          >
                            {pass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-t border-white/5">
                    <td className="py-5 px-3 text-gray-400" colSpan="4">
                      No student results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // student
  const pass = Boolean(data.pass);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            {data.testTitle || 'Test Results'}
          </h2>
          <p className="text-sm text-gray-400">Test ID: {data.testId || testId}</p>
          {data.subjectName ? (
            <p className="text-sm text-gray-400">Subject: {data.subjectName}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/results')}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
        >
          Back
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Score</p>
          <p className="text-2xl font-semibold text-white">
            {typeof data.totalQuestions === 'number' && data.totalQuestions > 0
              ? `${data.score}/${data.totalQuestions}`
              : String(data.score)}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Percentage</p>
          <p className="text-2xl font-semibold text-white">{data.percentage}%</p>
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
    </div>
  );
};

export default TestResultDetails;

