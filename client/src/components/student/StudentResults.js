import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const StudentResults = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tests');
        const list = Array.isArray(res.data) ? res.data : [];
        setTests(list);
      } catch (error) {
        console.error('Fetch tests error:', error);
        const msg = error.response?.data?.message || 'Failed to fetch tests';
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
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
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Results</h2>
          <p className="text-sm text-gray-400">Select a test to view your result</p>
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
                  <th className="py-2 px-3 font-semibold">Subject</th>
                  <th className="py-2 px-3 font-semibold">Test ID</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={String(test._id)} className="border-t border-white/5">
                    <td className="py-3 px-3 text-gray-200">{test.title || 'Untitled Test'}</td>
                    <td className="py-3 px-3 text-gray-400">
                      {test.subjectName || '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-400 break-all">
                      {String(test._id)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold bg-emerald-400/10 text-emerald-300">
                        {test.status || 'published'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/student/results/${test._id}`)}
                        className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
                      >
                        View
                      </button>
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

export default StudentResults;

