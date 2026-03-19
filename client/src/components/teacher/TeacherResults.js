import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const TeacherResults = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);

  const [selectedTestId, setSelectedTestId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await api.get('/results/teacher');
        setTests(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (error) {
        console.error('Teacher results fetch error:', error);
        toast.error(
          error.response?.data?.message || 'Failed to fetch results'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const filteredTests = useMemo(() => {
    return (tests || []).filter((t) => {
      if (selectedTestId && String(t.testId) !== String(selectedTestId)) {
        return false;
      }
      if (startDate) {
        const d = new Date(t.latestSubmittedAt || 0);
        const sd = new Date(startDate);
        if (d < sd) return false;
      }
      if (endDate) {
        const d = new Date(t.latestSubmittedAt || 0);
        const ed = new Date(endDate);
        // include endDate entire day
        ed.setHours(23, 59, 59, 999);
        if (d > ed) return false;
      }
      return true;
    });
  }, [tests, selectedTestId, startDate, endDate]);

  const handleView = async (testId) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalData(null);
    try {
      const res = await api.get(`/results/test/${testId}`);
      if (!res.data?.success) {
        toast.error(res.data?.message || 'Result not declared');
        setModalOpen(false);
        return;
      }
      setModalData(res.data?.data || null);
    } catch (error) {
      console.error('Teacher test results fetch error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to fetch test results'
      );
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
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
            Teacher Results
          </h2>
          <p className="text-sm text-gray-400">
            Test-wise published scores and student performance
          </p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-amber-300">
            No published results found yet.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">
                Filter by test
              </label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
              >
                <option value="">All tests</option>
                {tests.map((t) => (
                  <option key={String(t.testId)} value={String(t.testId)}>
                    {t.testTitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedTestId('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full md:w-auto px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2 px-3 font-semibold">Test</th>
                  <th className="py-2 px-3 font-semibold">Total Students</th>
                  <th className="py-2 px-3 font-semibold">Avg %</th>
                  <th className="py-2 px-3 font-semibold">Progress</th>
                  <th className="py-2 px-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length === 0 ? (
                  <tr className="border-t border-white/5">
                    <td className="py-5 px-3 text-gray-400" colSpan="5">
                      No results match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((t) => {
                    const pass = Number(t.avgPercentage || 0) >= 40;
                    const progressW = Math.max(
                      0,
                      Math.min(100, Number(t.avgPercentage || 0))
                    );
                    return (
                      <tr
                        key={String(t.testId)}
                        className="border-t border-white/5"
                      >
                        <td className="py-3 px-3 text-gray-200">
                          {t.testTitle}
                          <div className="text-[11px] text-gray-500 mt-1">
                            Latest: {t.latestSubmittedAt ? new Date(t.latestSubmittedAt).toLocaleDateString() : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-200">
                          {t.totalStudents}
                        </td>
                        <td className="py-3 px-3 text-gray-200">
                          {t.avgPercentage}%
                          <span
                            className={`ml-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${
                              pass
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-rose-400/10 text-rose-300'
                            }`}
                          >
                            {pass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-44 max-w-[200px] bg-white/5 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 ${
                                pass ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${progressW}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleView(t.testId)}
                            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-3xl bg-slate-950 border border-white/10 rounded-2xl p-5">
            {modalLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {modalData?.testTitle || 'Test Results'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {modalData?.students?.length || 0} students
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-200 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto">
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
                      {Array.isArray(modalData?.students) &&
                      modalData.students.length > 0 ? (
                        modalData.students.map((s, idx) => {
                          const pass = Boolean(s.pass);
                          return (
                            <tr
                              key={String(s.studentId || idx)}
                              className="border-t border-white/5"
                            >
                              <td className="py-3 px-3 text-gray-200">
                                {s.studentName}
                              </td>
                              <td className="py-3 px-3 text-gray-200">
                                {modalData?.totalQuestions > 0
                                  ? `${s.score}/${modalData.totalQuestions}`
                                  : `${s.score}`}
                              </td>
                              <td className="py-3 px-3 text-gray-200">
                                {s.percentage}%
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherResults;

