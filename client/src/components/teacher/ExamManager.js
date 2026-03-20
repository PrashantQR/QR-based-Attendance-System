import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ExamManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [file, setFile] = useState(null);
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);

  const selectedSubjectName = useMemo(() => {
    if (!Array.isArray(subjects) || !selectedSubject) return '';
    const found = subjects.find((s) => String(s._id) === String(selectedSubject));
    return String(found?.name || '').trim();
  }, [subjects, selectedSubject]);

  const filteredTests = useMemo(() => {
    if (!Array.isArray(tests)) return [];
    if (!selectedSubject) return [];
    return tests.filter(
      (t) => {
        const subjectIdMatch = t.subjectId
          ? String(t.subjectId) === String(selectedSubject)
          : false;

        if (subjectIdMatch) return true;

        // Fallback to name matching (helps if subjectId is missing/mismatched
        // but subjectName is still populated).
        if (!selectedSubjectName) return false;
        return (
          String(t.subjectName || '')
            .trim()
            .toLowerCase() === selectedSubjectName.trim().toLowerCase()
        );
      }
    );
  }, [tests, selectedSubject, selectedSubjectName]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const res = await api.get('/teacher/subjects');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setSubjects(list);
        if (!selectedSubject && list.length > 0) {
          setSelectedSubject(String(list[0]._id));
        }
      } catch (error) {
        console.error('Fetch teacher subjects error:', error);
        toast.error(
          error.response?.data?.message || 'Failed to fetch subjects'
        );
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchTests = async () => {
      if (!selectedSubject) {
        setTests([]);
        return;
      }
      setTestsLoading(true);
      try {
        const res = await api.get('/tests');
        const list = Array.isArray(res.data) ? res.data : [];
        setTests(list);
      } catch (error) {
        console.error('Fetch teacher tests error:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch tests');
        setTests([]);
      } finally {
        setTestsLoading(false);
      }
    };

    fetchTests();
  }, [selectedSubject]);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', selectedSubject);
      if (title && !testId) {
        formData.append('title', title);
        formData.append('durationMinutes', String(durationMinutes));
      }
      if (testId) {
        formData.append('testId', testId);
      }
      const res = await api.post('/tests/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data?.data;
      setTestId(String(data?.testId || ''));
      toast.success(res.data?.message || 'Questions imported');
    } catch (error) {
      console.error('Exam import error:', error);
      const message = error.response?.data?.message || 'Failed to import questions';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!testId) {
      toast.error('Test ID is required to generate QR');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/tests/${testId}/qr`, {
        expiresInSeconds: 120
      });
      setQrPayload(res.data?.data?.qrPayload || null);
      toast.success(res.data?.message || 'Exam QR generated');
    } catch (error) {
      console.error('Exam QR error:', error);
      const message = error.response?.data?.message || 'Failed to generate exam QR';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!testId) {
      toast.error('Test ID is required to activate');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/tests/${testId}/activate`);
      toast.success(res.data?.message || 'Test activated');
    } catch (error) {
      console.error('Activate exam error:', error);
      const message = error.response?.data?.message || 'Failed to activate test';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Exam Manager</h1>
        <p className="text-sm text-gray-400">
          Import questions from CSV/Excel, activate tests, and generate exam QR.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">1. Import Questions</h2>
          <form onSubmit={handleImport} className="space-y-3">
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                disabled={subjectsLoading}
              >
                <option value="">
                  {subjectsLoading ? 'Loading subjects…' : 'Select Subject'}
                </option>
                {subjects.map((sub) => (
                  <option key={String(sub._id)} value={String(sub._id)}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Test Title (for new test)
              </label>
              <input
                type="text"
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm MCQ Test"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value || 10))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Existing Test ID (optional)
              </label>
              <input
                type="text"
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="Use to append questions to an existing test"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Upload CSV / Excel
              </label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-60"
            >
              {loading ? 'Processing…' : 'Import Questions'}
            </button>
          </form>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">2. Activate, QR & Results</h2>
          <p className="text-xs text-gray-400 mb-2">
            Activate the test so students can start via QR. Then generate a time-limited exam QR.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Select Test (filtered by subject)
              </label>
              <select
                value={testId}
                onChange={(e) => {
                  setTestId(e.target.value);
                  setQrPayload(null);
                }}
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                disabled={testsLoading || !filteredTests.length}
              >
                {testsLoading && (
                  <option value="">Loading tests…</option>
                )}
                {!testsLoading && !filteredTests.length && (
                  <option value="" disabled>
                    No tests for this subject yet
                  </option>
                )}
                {filteredTests.map((t) => (
                  <option key={String(t._id)} value={String(t._id)}>
                    {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleActivate}
                className="flex-1 border border-amber-500 text-amber-400 hover:bg-amber-500/10 rounded-lg py-2 text-sm font-medium"
              >
                Activate Test
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerateQr}
                className="flex-1 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 rounded-lg py-2 text-sm font-medium"
              >
                Generate Exam QR
              </button>
            </div>
            {qrPayload && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-center">
                  <div className="inline-block bg-white p-3 rounded-xl shadow-lg">
                    <QRCodeCanvas
                      value={JSON.stringify(qrPayload)}
                      size={320}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-3 text-xs text-gray-300 break-words">
                  <p className="font-semibold mb-1 text-gray-200">
                    QR Payload (students scan this with Exam Scanner):
                  </p>
                  <pre className="whitespace-pre-wrap text-[11px]">
                    {JSON.stringify(qrPayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamManager;

