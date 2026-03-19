import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ExamManager = () => {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [file, setFile] = useState(null);
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV or Excel file');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
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

  const handlePublish = async () => {
    if (!testId) {
      toast.error('Test ID is required to publish results');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/tests/${testId}/publish`);
      toast.success(res.data?.message || 'Results published');
    } catch (error) {
      console.error('Publish exam error:', error);
      const message = error.response?.data?.message || 'Failed to publish results';
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
          Import questions from CSV/Excel, generate exam QR, and publish results.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">1. Import Questions</h2>
          <form onSubmit={handleImport} className="space-y-3">
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
            Activate the test so students can start via QR. Then generate a time-limited exam QR. Publish results when the exam is over.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Current Test ID
              </label>
              <input
                type="text"
                className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-sm text-gray-100"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="After import, this is set automatically"
              />
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
              <button
                type="button"
                disabled={loading}
                onClick={handlePublish}
                className="flex-1 border border-sky-500 text-sky-400 hover:bg-sky-500/10 rounded-lg py-2 text-sm font-medium"
              >
                Publish Results
              </button>
            </div>
            {qrPayload && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-center">
                  <div className="inline-block bg-white p-3 rounded-xl shadow-lg">
                    <QRCodeCanvas
                      value={JSON.stringify(qrPayload)}
                      size={260}
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

