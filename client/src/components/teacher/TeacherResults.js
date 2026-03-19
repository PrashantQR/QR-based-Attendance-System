import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const TeacherResults = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tests');
      const list = Array.isArray(res.data) ? res.data : [];
      setTests(list);
      setErrorMessage('');
    } catch (error) {
      console.error('Fetch tests error:', error);
      const msg = error.response?.data?.message || 'Failed to fetch tests';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handlePublish = async (testId) => {
    try {
      setLoading(true);
      const res = await api.post(`/tests/${testId}/publish`);
      toast.success(res.data?.message || 'Results published');
      await fetchTests();
    } catch (error) {
      console.error('Publish test error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to publish results'
      );
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    const common =
      'inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold';
    if (s === 'active') {
      return `${common} bg-amber-400/10 text-amber-300`;
    }
    if (s === 'completed') {
      return `${common} bg-sky-400/10 text-sky-300`;
    }
    if (s === 'published') {
      return `${common} bg-emerald-400/10 text-emerald-300`;
    }
    return `${common} bg-white/5 text-gray-300`;
  };

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
          <p className="text-sm text-gray-400">Select a test to view student scores</p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">
            {errorMessage || 'No tests found.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2 px-3 font-semibold">Test Name</th>
                  <th className="py-2 px-3 font-semibold">Test ID</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={String(test._id)} className="border-t border-white/5">
                    <td className="py-3 px-3 text-gray-200">{test.title || 'Untitled Test'}</td>
                    <td className="py-3 px-3 text-gray-400 break-all">
                      {String(test._id)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={statusBadge(test.status)}>
                        {test.status || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={String(test.status) !== 'completed'}
                          onClick={() => handlePublish(String(test._id))}
                          className="px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sm text-sky-300 hover:bg-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Publish Results
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/results/${test._id}`)}
                          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherResults;

