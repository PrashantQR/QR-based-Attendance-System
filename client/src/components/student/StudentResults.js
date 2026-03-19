import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const StudentResults = () => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [emptyMessage, setEmptyMessage] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get('/results/student');
        const data = res.data?.data;
        const list = Array.isArray(data) ? data : [];
        setResults(list);
        setEmptyMessage(res.data?.message || '');
      } catch (error) {
        console.error('Student results fetch error:', error);
        toast.error(
          error.response?.data?.message || 'Failed to fetch results'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Results
          </h2>
          <p className="text-sm text-gray-400">
            Your published exam scores
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">
            {emptyMessage || 'No results found yet. Teachers publish results after exams.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2 px-3 font-semibold">Test</th>
                  <th className="py-2 px-3 font-semibold">Date</th>
                  <th className="py-2 px-3 font-semibold">Score</th>
                  <th className="py-2 px-3 font-semibold">Percentage</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const pass = Boolean(r.pass);
                  return (
                    <tr
                      key={String(r.testId)}
                      className="border-t border-white/5"
                    >
                      <td className="py-3 px-3 text-gray-200">
                        {r.testTitle || 'Untitled Test'}
                      </td>
                      <td className="py-3 px-3 text-gray-400">
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-gray-200">
                        {r.totalQuestions > 0
                          ? `${r.score}/${r.totalQuestions}`
                          : `${r.score}`}
                      </td>
                      <td className="py-3 px-3 text-gray-200">
                        {r.percentage}%
                      </td>
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;

