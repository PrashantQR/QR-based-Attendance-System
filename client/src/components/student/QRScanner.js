import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaQrcode, FaCheck, FaTimes, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

const QRScanner = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);

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
    if (decodedText) {
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      setResult(decodedText);
      await validateAndMarkAttendance(decodedText);
    }
  };

  const handleError = (err) => {
    // html5-qrcode emits frequent non-fatal scan errors; only handle fatal errors
    const errString = typeof err === 'string' ? err : (err?.message || err?.name || '');
    const fatalHints = [
      'NotAllowedError', // permissions denied
      'NotFoundError',   // no camera
      'NotReadableError',
      'OverconstrainedError',
      'StreamApiNotSupportedError',
      'InsecureContextError',
      'Permission denied',
      'permission'
    ];

    // Only handle fatal errors - ignore common decode errors
    if (fatalHints.some(h => errString.toLowerCase().includes(h.toLowerCase()))) {
      let errorMessage = '';
      
      if (errString.includes('NotAllowedError') || errString.toLowerCase().includes('permission')) {
        errorMessage = 'Camera permission denied. ';
        if (/Android/i.test(navigator.userAgent)) {
          errorMessage += 'Tap the camera icon 🔒 in your browser address bar and select "Allow".';
        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          errorMessage += 'Go to iPhone Settings → Safari → Camera → Allow.';
        } else {
          errorMessage += 'Please allow camera access in your browser settings.';
        }
      } else if (errString.includes('NotFoundError')) {
        errorMessage = 'No camera found on this device. Please use a device with a camera.';
      } else if (errString.includes('NotReadableError')) {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera.';
      } else if (errString.includes('InsecureContextError')) {
        errorMessage = 'Camera access requires HTTPS connection. Please ensure the URL starts with https://';
      } else {
        errorMessage = 'Unable to access camera. Please check your camera permissions and try again.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
      setScanning(false);
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        }
      } catch (_) {}
      return;
    }

    // Ignore non-fatal decode errors (these are normal during scanning)
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
      const validateResponse = await axios.post(
        `${API_BASE_URL}/api/qr/validate`,
        { code: qrCode },
        { headers: authHeaders }
      );

      if (validateResponse.data.success) {
        // Mark attendance with coordinates
        const attendanceResponse = await axios.post(
          `${API_BASE_URL}/api/attendance/mark`,
          {
            qrCodeId: validateResponse.data.data._id,
            coordinates
          },
          { headers: authHeaders }
        );

        if (attendanceResponse.data.success) {
          toast.success(attendanceResponse.data.message);
          setResult({
            success: true,
            message: attendanceResponse.data.message,
            data: attendanceResponse.data.data
          });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(message);
      setResult({
        success: false,
        message: message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
  };

  const checkCameraSupport = async () => {
    // Check if browser supports camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
      setScanning(false);
      return false;
    }

    // Check for secure context (HTTPS)
    if (window.isSecureContext === false) {
      setCameraError('Camera access requires HTTPS connection. Please access this site via HTTPS.');
      setScanning(false);
      return false;
    }

    return true;
  };

  const startScanner = async () => {
    setScanning(true);
    setResult(null);
    setCameraError(null);
    
    // Check camera support first
    const isSupported = await checkCameraSupport();
    if (!isSupported) {
      setScanning(false);
      return;
    }
    
    // Let Html5Qrcode handle permission request directly (don't pre-request)
    // This avoids double permission requests which can cause issues
    try {
      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
      }
      
      // Clean the previous scanner div
      const qrReaderElement = document.getElementById('qr-reader');
      if (qrReaderElement) {
        qrReaderElement.innerHTML = '';
      }
      
      // Instantiate and start - this will request permission automatically
      scannerRef.current = new Html5Qrcode('qr-reader');
      await scannerRef.current.start(
        { facingMode: { exact: 'environment' } },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 }, 
          aspectRatio: 1.0,
          disableFlip: false
        },
        handleScan,
        handleError
      );
      // Clear any previous errors if scanning started successfully
      setCameraError(null);
    } catch (e) {
      const errorMsg = e?.message || e?.name || 'Unknown error';
      
      // If exact back camera fails, try general environment camera
      if (errorMsg.includes('environment') || errorMsg.includes('exact')) {
        try {
          if (scannerRef.current) {
            try {
              await scannerRef.current.stop();
              scannerRef.current.clear();
            } catch (_) {}
            scannerRef.current = null;
          }
          
          const qrReaderElement = document.getElementById('qr-reader');
          if (qrReaderElement) {
            qrReaderElement.innerHTML = '';
          }
          
          scannerRef.current = new Html5Qrcode('qr-reader');
          await scannerRef.current.start(
            { facingMode: 'environment' },
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 }, 
              aspectRatio: 1.0,
              disableFlip: false
            },
            handleScan,
            handleError
          );
          setCameraError(null);
          return;
        } catch (err2) {
          // Fall through to next try
        }
      }
      
      // Try user-facing camera as fallback
      try {
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch (_) {}
          scannerRef.current = null;
        }
        
        const qrReaderElement = document.getElementById('qr-reader');
        if (qrReaderElement) {
          qrReaderElement.innerHTML = '';
        }
        
        scannerRef.current = new Html5Qrcode('qr-reader');
        await scannerRef.current.start(
          { facingMode: 'user' },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }, 
            aspectRatio: 1.0,
            disableFlip: false
          },
          handleScan,
          handleError
        );
        setCameraError(null);
      } catch (err3) {
        // Try any available camera device
        try {
          if (scannerRef.current) {
            try {
              await scannerRef.current.stop();
              scannerRef.current.clear();
            } catch (_) {}
            scannerRef.current = null;
          }
          
          const qrReaderElement = document.getElementById('qr-reader');
          if (qrReaderElement) {
            qrReaderElement.innerHTML = '';
          }
          
          scannerRef.current = new Html5Qrcode('qr-reader');
          // Get available cameras and use the first one
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            await scannerRef.current.start(
              devices[0].id,
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 }, 
                aspectRatio: 1.0,
                disableFlip: false
              },
              handleScan,
              handleError
            );
            setCameraError(null);
          } else {
            throw new Error('No camera devices found');
          }
        } catch (finalErr) {
          // All attempts failed - show error
          const finalErrorMsg = finalErr?.message || finalErr?.name || errorMsg || 'Unknown error';
          let userMessage = 'Unable to access camera. ';
          
          if (finalErrorMsg.includes('NotAllowedError') || finalErrorMsg.includes('Permission denied') || finalErrorMsg.includes('permission')) {
            userMessage = 'Camera permission denied. ';
            if (/Android/i.test(navigator.userAgent)) {
              userMessage += 'Tap the camera icon 🔒 in your browser address bar and select "Allow".';
            } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              userMessage += 'Go to iPhone Settings → Safari → Camera → Allow.';
            } else {
              userMessage += 'Please allow camera access in your browser settings.';
            }
          } else if (finalErrorMsg.includes('NotFoundError') || finalErrorMsg.includes('No camera') || finalErrorMsg.includes('no camera')) {
            userMessage = 'No camera found on this device. Please use a device with a camera.';
          } else if (finalErrorMsg.includes('NotReadableError') || finalErrorMsg.includes('busy')) {
            userMessage = 'Camera is being used by another app. Please close other apps using the camera and try again.';
          } else if (finalErrorMsg.includes('InsecureContextError') || finalErrorMsg.includes('HTTPS')) {
            userMessage = 'Camera access requires HTTPS. Please ensure the URL starts with https://';
          } else {
            userMessage += 'Please check your camera permissions and try again.';
          }
          
          setCameraError(userMessage);
          toast.error(userMessage);
          setScanning(false);
        }
      }
    }
  };

  return (
    <div>
      <div className="row mb-3 align-items-center">
        <div className="col">
          <h2 className="fw-bold text-white mb-0">Scan QR Code</h2>
          <p className="text-white-50 mb-0">Scan the QR code to mark your attendance</p>
        </div>
        <div className="col-auto">
          <button className="btn btn-outline-light me-2" onClick={() => navigate('/student')}>
            <FaArrowLeft className="me-2" /> Dashboard
          </button>
          <button className="btn btn-danger" onClick={() => { logout(); navigate('/login'); }}>
            <FaTimes className="me-2" /> Logout
          </button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3 text-center">QR Code Scanner</h5>
              
              {cameraError && (
                <div className="alert alert-warning mb-3">
                  <FaTimes className="me-2" />
                  <strong>Camera Access Error:</strong>
                  <p className="mb-2 mt-2">{cameraError}</p>
                  <div className="small">
                    <strong>How to Fix:</strong>
                    <ul className="mb-2 mt-2 text-start">
                      {(/Android/i.test(navigator.userAgent)) && (
                        <>
                          <li>Tap the camera icon 🔒 in your browser's address bar</li>
                          <li>Select "Allow" for camera access</li>
                          <li>Or go to Browser Settings → Site Settings → Camera → Allow</li>
                        </>
                      )}
                      {(/iPhone|iPad|iPod/i.test(navigator.userAgent)) && (
                        <>
                          <li>Go to iPhone Settings → Safari → Camera → Allow</li>
                          <li>Or tap the "aA" icon in Safari → Website Settings → Camera → Allow</li>
                        </>
                      )}
                      <li>Close any other apps that might be using your camera</li>
                      <li>Refresh the page and click "Start Scanning" again</li>
                      <li>Make sure you're using HTTPS (check the URL starts with https://)</li>
                    </ul>
                  </div>
                  <button
                    className="btn btn-primary mt-2"
                    onClick={startScanner}
                  >
                    <FaCamera className="me-2" />
                    Try Again
                  </button>
                </div>
              )}

              {!scanning && !result && !cameraError && (
                <div className="text-center">
                  <FaQrcode size={100} className="text-muted mb-3" />
                  <p className="text-muted">Click the button below to start scanning</p>
                  <button
                    className="btn btn-primary"
                    onClick={startScanner}
                  >
                    <FaCamera className="me-2" />
                    Start Scanning
                  </button>
                </div>
              )}

              {scanning && !cameraError && (
                <div className="text-center">
                  <div className="scanner-container mb-3">
                    <div id="qr-reader"></div>
                  </div>
                  <p className="text-muted">Point your camera at the QR code</p>
                  <button
                    className="btn btn-outline-secondary btn-sm mt-2"
                    onClick={() => {
                      if (scannerRef.current) {
                        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
                      }
                      setScanning(false);
                    }}
                  >
                    Stop Scanning
                  </button>
                </div>
              )}

              {result && (
                <div className="text-center">
                  {result.success ? (
                    <div className="alert alert-success">
                      <FaCheck className="me-2" />
                      {result.message}
                    </div>
                  ) : (
                    <div className="alert alert-danger">
                      <FaTimes className="me-2" />
                      {result.message}
                    </div>
                  )}
                  
                  <div className="mt-3 d-flex flex-column flex-sm-row justify-content-center gap-2">
                    {result.success ? (
                      <>
                        <button className="btn btn-success" onClick={() => navigate('/student')}>
                          <FaArrowLeft className="me-2" />
                          Back to Dashboard
                        </button>
                        <button className="btn btn-outline-primary" onClick={resetScanner}>
                          <FaQrcode className="me-2" />
                          Scan Another
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-primary" onClick={resetScanner} disabled={loading}>
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaQrcode className="me-2" />
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
        </div>
      </div>

      {/* Instructions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Instructions</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>1.</strong> Click "Start Scanning" to activate your camera
                </li>
                <li className="mb-2">
                  <strong>2.</strong> Allow camera permissions when prompted by your browser
                </li>
                <li className="mb-2">
                  <strong>3.</strong> Point your camera at the QR code displayed by your teacher
                </li>
                <li className="mb-2">
                  <strong>4.</strong> Hold steady until the QR code is detected
                </li>
                <li className="mb-2">
                  <strong>5.</strong> Your attendance will be automatically marked
                </li>
                <li className="mb-2">
                  <strong>6.</strong> You can only mark attendance once per QR code
                </li>
              </ul>
              {cameraError && (
                <div className="alert alert-info mt-3 mb-0">
                  <small>
                    <strong>Camera Permission Help:</strong><br />
                    If camera access is denied, go to your browser settings → Site Settings → Camera → Allow
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 