import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaQrcode } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ExamScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const isBlockedRef = useRef(false);
  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (decodedText) => {
    if (
      !decodedText ||
      scannedRef.current ||
      isBlockedRef.current ||
      loading ||
      initializing
    )
      return;
    scannedRef.current = true;
    setScanning(false);

    try {
      let payload;
      try {
        payload = JSON.parse(decodedText);
      } catch {
        toast.error('Invalid exam QR payload');
        scannedRef.current = false;
        setScanning(true);
        return;
      }

      if (!payload.testId || !payload.token) {
        toast.error('Invalid exam QR data');
        scannedRef.current = false;
        setScanning(true);
        return;
      }

      setLoading(true);
      const res = await api.post('/exam/start', {
        testId: payload.testId,
        token: payload.token
      });

      const data = res.data?.data;
      if (!data?.testId || !Array.isArray(data?.questions)) {
        toast.error('Failed to start exam');
        scannedRef.current = false;
        setScanning(true);
        return;
      }

      navigate('/student/exam/take', {
        state: {
          testId: data.testId,
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          startedAt: data.startedAt,
          questions: data.questions
        }
      });
    } catch (error) {
      console.error('Exam start via QR error:', error);
      const message = error.response?.data?.message || 'Failed to start exam';
      const isTestNotActive = typeof message === 'string' && /not active/i.test(message);
      if (isTestNotActive) {
        // Prevent continuous toasts: keep the scanner stopped until teacher activates the test.
        setBlockedMessage(message);
        isBlockedRef.current = true;
        setScanning(false);
        await stopCurrentScanner();
        return;
      }

      toast.error(message);
      setBlockedMessage('');
      scannedRef.current = false;
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    // html5-qrcode emits frequent non-fatal scan errors; show only actionable ones
    const errString = typeof err === 'string' ? err : (err?.message || '');
    const fatalHints = [
      'NotAllowedError', // permissions denied
      'NotFoundError', // no camera
      'NotReadableError',
      'OverconstrainedError',
      'StreamApiNotSupportedError',
      'InsecureContextError'
    ];

    if (fatalHints.some((h) => errString.includes(h))) {
      toast.error(
        'Camera error: ' + (errString || 'permission or device issue')
      );
      setScanning(false);
    }
  };

  const stopCurrentScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      try {
        await scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  };

  const attemptStart = async (cameraConfig) => {
    try {
      scannerRef.current = new Html5Qrcode('exam-qr-reader');
      await scannerRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 320, height: 320 },
          aspectRatio: 1.0
        },
        handleScan,
        handleError
      );
      return true;
    } catch {
      return false;
    }
  };

  const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setInitializing(true);
    setBlockedMessage('');
    isBlockedRef.current = false;
    scannedRef.current = false;
    setScanning(true);

    try {
      await stopCurrentScanner();
      const started =
        (await attemptStart({ facingMode: { exact: 'environment' } })) ||
        (await attemptStart({ facingMode: 'environment' })) ||
        (await attemptStart({ facingMode: 'user' }));
      if (!started) {
        toast.error('Unable to access camera');
        setScanning(false);
      }
    } finally {
      setInitializing(false);
      isStartingRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Scan Exam QR</h2>
          <p className="text-sm text-gray-400">
            Scan the exam QR shared by your teacher to start the test.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student')}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
        >
          <FaArrowLeft /> Dashboard
        </button>
      </div>

      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="w-full max-w-md bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 text-center">Exam QR Scanner</h3>

          {!scanning && (
            <div className="text-center">
              <FaQrcode size={72} className="text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                {blockedMessage
                  ? blockedMessage
                  : 'Click below to start scanning'}
              </p>
              <button
                type="button"
                onClick={startScanner}
                disabled={initializing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-secondary px-4 py-2.5 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                {initializing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <FaCamera />
                    Start Scanning
                  </>
                )}
              </button>
            </div>
          )}

          {scanning && (
            <div className="text-center">
              <div className="scanner-container mb-3 flex justify-center">
                <div id="exam-qr-reader" className="w-full" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Point your camera at the exam QR</p>
              {initializing && <p className="text-xs text-emerald-300">Opening camera...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamScanner;

