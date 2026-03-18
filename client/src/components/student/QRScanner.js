import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FaQrcode, FaCheck, FaTimes, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const QRScanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);
  const scannedRef = useRef(false);
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const handleScan = async (decodedText) => {
    if (!decodedText) return;
    if (scannedRef.current || loading || initializing) return;

    // CRITICAL: lock further scans while we validate + mark.
    scannedRef.current = true;
    setScanned(true);
    setScanning(false);

    try {
      // Stop camera after a successful decode to prevent duplicate marks.
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (_) {}
        try {
          await scannerRef.current.clear();
        } catch (_) {}
      }

      const markResult = await validateAndMarkAttendance(decodedText);

      setResult({
        success: markResult.success,
        message: markResult.message,
        data: markResult.data
      });

      if (markResult.success) {
        setFeedbackModal({
          open: true,
          title: 'Attendance Marked ✅',
          message: markResult.message
        });
        toast.success(markResult.message);
      } else if (markResult.alreadyMarked) {
        setFeedbackModal({
          open: true,
          title: 'Already marked for this session',
          message: markResult.message
        });
        toast.info(markResult.message);
      } else {
        setFeedbackModal({
          open: true,
          title: 'Failed to mark attendance',
          message: markResult.message
        });
        toast.error(markResult.message);
      }

      // Allow next scan after a short delay (anti-glitch).
      setTimeout(() => {
        setFeedbackModal((prev) => ({ ...prev, open: false }));
        setScanned(false);
        scannedRef.current = false;
        resetScanner();
      }, 3000);
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Failed to mark attendance';
      setResult({ success: false, message });
      toast.error(message);

      setTimeout(() => {
        setScanned(false);
        scannedRef.current = false;
        setFeedbackModal({ open: false, title: '', message: '' });
        resetScanner();
      }, 3000);
    }
  };

  const handleError = (err) => {
    // html5-qrcode emits frequent non-fatal scan errors; throttle and only surface fatal cases
    const errString = typeof err === 'string' ? err : (err?.message || '');
    const fatalHints = [
      'NotAllowedError', // permissions denied
      'NotFoundError',   // no camera
      'NotReadableError',
      'OverconstrainedError',
      'StreamApiNotSupportedError',
      'InsecureContextError'
    ];

    if (fatalHints.some(h => errString.includes(h))) {
      toast.error('Camera error: ' + (errString || 'permission or device issue'));
      setScanning(false);
      try {
        scannerRef.current?.stop();
      } catch (_) {}
      return;
    }

    // Ignore non-fatal decode errors to avoid spamming the UI
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied or unavailable:', error);
          resolve({ latitude: null, longitude: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const validateAndMarkAttendance = async (qrCode) => {
    setLoading(true);
    try {
      // Get current location coordinates
      const coordinates = await getCurrentLocation();

      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // First validate the QR code
      const validateResponse = await api.post(
        '/qr/validate',
        { code: qrCode },
        { headers: authHeaders }
      );

      if (!validateResponse.data?.success) {
        return {
          success: false,
          alreadyMarked: false,
          message:
            validateResponse.data?.message ||
            'Invalid QR code or not a valid session'
        };
      }

      const attendanceResponse = await api.post(
        '/attendance/mark',
        {
          qrCodeId: validateResponse.data.data._id,
          coordinates
        },
        { headers: authHeaders }
      );

      return {
        success: Boolean(attendanceResponse.data?.success),
        alreadyMarked: false,
        message:
          attendanceResponse.data?.message ||
          'Attendance marked successfully',
        data: attendanceResponse.data?.data || null
      };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to mark attendance';
      const alreadyMarked =
        message.toLowerCase().includes('already marked') ||
        error.response?.data?.error === 'Attendance already marked';

      return {
        success: false,
        alreadyMarked,
        message,
        data: null
      };
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
    startScanner();
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
      scannerRef.current = new Html5Qrcode('qr-reader');
      await scannerRef.current.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        handleScan,
        handleError
      );
      return true;
    } catch (err) {
      return false;
    }
  };

  const startScanner = async () => {
    if (isStartingRef.current) return;

    isStartingRef.current = true;
    setInitializing(true);
    setScanning(true);
    setResult(null);

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

  // Auto-start scanning when the page loads
  useEffect(() => {
    startScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Scan QR Code</h2>
          <p className="text-sm text-gray-400">Scan the QR code to mark your attendance</p>
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
          <h3 className="text-sm font-semibold text-gray-200 mb-4 text-center">QR Code Scanner</h3>

          <div className="bg-black/30 rounded-xl p-3 border border-white/10 mb-4">
            <div className="flex flex-col gap-2 text-xs text-gray-300">
              <div>
                <span className="font-semibold text-gray-200">Enrolled Subjects:</span>{' '}
                {Array.isArray(user?.subjects) && user.subjects.length > 0
                  ? user.subjects.join(', ')
                  : 'No subjects assigned'}
              </div>
              <div className="text-gray-400">
                {user?.course || 'N/A'} · {user?.semester || 'N/A'}
              </div>
            </div>
          </div>

          {!scanning && !result && (
            <div className="text-center">
              <FaQrcode size={72} className="text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">Click below to start scanning</p>
              <button
                type="button"
                onClick={startScanner}
                disabled={initializing || scanned}
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
                <div id="qr-reader" className="w-full" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Point your camera at the QR code</p>
              {initializing && <p className="text-xs text-emerald-300">Opening camera...</p>}
            </div>
          )}

          {result && (
            <div className="text-center">
              <div
                className={[
                  'rounded-xl p-3 border text-sm mb-4',
                  result.success
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                    : 'bg-red-500/10 border-red-400/30 text-red-200'
                ].join(' ')}
              >
                {result.success ? <FaCheck className="inline mr-2" /> : <FaTimes className="inline mr-2" />}
                {result.message}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row justify-center gap-2">
                {result.success ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/student')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                    >
                      <FaArrowLeft /> Back to Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={resetScanner}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                    >
                      <FaQrcode /> Scan Another
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={resetScanner}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-secondary px-4 py-2 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaQrcode />
                        Scan Another
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {feedbackModal.open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {}}
        >
          <div className="w-full max-w-sm bg-slate-900/95 border border-slate-700 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-2">
              {feedbackModal.title}
            </h3>
            <p className="text-sm text-gray-300">{feedbackModal.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li><span className="font-semibold text-gray-200">1.</span> Click “Start Scanning” to activate your camera</li>
          <li><span className="font-semibold text-gray-200">2.</span> Point your camera at the QR code displayed by your teacher</li>
          <li><span className="font-semibold text-gray-200">3.</span> Hold steady until the QR code is detected</li>
          <li><span className="font-semibold text-gray-200">4.</span> Your attendance will be automatically marked</li>
          <li><span className="font-semibold text-gray-200">5.</span> You can only mark attendance once per QR code</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner; 