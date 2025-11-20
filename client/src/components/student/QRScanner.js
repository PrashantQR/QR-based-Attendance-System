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
  const [initializing, setInitializing] = useState(false);
  const scannerRef = useRef(null);
  const isInitializingRef = useRef(false);

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
    // html5-qrcode emits frequent non-fatal scan errors during QR detection
    // Only handle fatal errors that actually prevent camera access
    const errString = typeof err === 'string' ? err : (err?.message || err?.name || '');
    
    // Only handle truly fatal errors - ignore common decode/scan errors
    // Decode errors like "No QR code found" are normal and should be ignored
    const fatalErrors = [
      'NotAllowedError',      // permissions denied - but check if scanning is already active
      'NotFoundError',        // no camera - only show if really no camera
      'NotReadableError',     // camera busy - only if camera can't be read
      'StreamApiNotSupportedError',
      'InsecureContextError',
      'constraints not satisfied', // camera constraint error
      'could not start video stream', // actual stream error
      'Permission denied'     // explicit permission denial
    ];

    // Only show error if it's a fatal error AND scanning is not already active
    // If scanning is active, these are likely just decode errors
    const isFatalError = fatalErrors.some(h => errString.toLowerCase().includes(h.toLowerCase()));
    const isDecodeError = errString.toLowerCase().includes('qr code') || 
                         errString.toLowerCase().includes('decode') ||
                         errString.toLowerCase().includes('not found') ||
                         errString.toLowerCase().includes('no qr');
    
    // Only handle if it's a fatal error AND not a decode error AND not already scanning successfully
    if (isFatalError && !isDecodeError && !scannerRef.current) {
      // This is a real camera access error
      let errorMessage = '';
      
      if (errString.includes('NotAllowedError') || errString.toLowerCase().includes('permission denied')) {
        errorMessage = 'Camera permission denied. ';
        if (/Android/i.test(navigator.userAgent)) {
          errorMessage += 'Tap the camera icon 🔒 in your browser address bar and select "Allow".';
        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          errorMessage += 'Go to iPhone Settings → Safari → Camera → Allow.';
        } else {
          errorMessage += 'Please allow camera access in your browser settings.';
        }
      } else if (errString.includes('NotFoundError') && !errString.toLowerCase().includes('qr')) {
        errorMessage = 'No camera found on this device. Please use a device with a camera.';
      } else if (errString.includes('NotReadableError')) {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera.';
      } else if (errString.includes('InsecureContextError')) {
        errorMessage = 'Camera access requires HTTPS connection. Please ensure the URL starts with https://';
      } else if (errString.includes('constraints not satisfied') || errString.includes('could not start')) {
        errorMessage = 'Unable to start camera. Please check your camera permissions and try refreshing the page.';
      } else {
        // For other errors, don't show generic message - might be temporary
        console.warn('Camera error (non-fatal):', errString);
        return;
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

    // Ignore all decode/scan errors - these are normal during QR code scanning
    // Only log them for debugging, don't show to user
    if (isDecodeError || errString.toLowerCase().includes('scan')) {
      return; // Silently ignore - these are expected
    }
    
    // For any other errors, just log but don't stop scanning
    console.warn('Non-fatal scanner error:', errString);
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
    // Prevent multiple simultaneous initialization attempts
    if (isInitializingRef.current || initializing) {
      return;
    }
    
    isInitializingRef.current = true;
    setInitializing(true);
    setScanning(true);
    setResult(null);
    setCameraError(null);
    
    try {
      // Check camera support first
      const isSupported = await checkCameraSupport();
      if (!isSupported) {
        setScanning(false);
        isInitializingRef.current = false;
        setInitializing(false);
        return;
      }
      
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
      
      // Create scanner instance
      scannerRef.current = new Html5Qrcode('qr-reader');
      
      // Start scanner - try back camera first (best for QR scanning)
      // Use facingMode directly - this requests permission automatically
      try {
        // Try back camera (environment) first - most common for mobile QR scanning
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
        
        // Success - clear errors and finish initialization
        setCameraError(null);
        setInitializing(false);
        isInitializingRef.current = false;
        return;
      } catch (startErr) {
        // If back camera fails, try front camera as fallback
        const errorMsg = startErr?.message || startErr?.name || '';
        
        // Check if scanner actually started successfully despite the error
        // Sometimes Html5Qrcode throws errors but camera still starts
        // Check if video element exists in the scanner div
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit
        const qrReaderElement = document.getElementById('qr-reader');
        if (qrReaderElement && scannerRef.current) {
          try {
            // Check if video element exists (indicates camera is actually running)
            const videoElement = qrReaderElement.querySelector('video');
            if (videoElement && videoElement.readyState > 0) {
              // Camera is actually working! Clear errors
              setCameraError(null);
              setInitializing(false);
              isInitializingRef.current = false;
              return;
            }
          } catch (_) {
            // Scanner check failed, continue with fallback
          }
        }
        
        // Only try front camera if it's clearly not a permission error
        const isPermissionError = errorMsg.includes('NotAllowedError') || 
                                  errorMsg.includes('Permission denied') || 
                                  errorMsg.toLowerCase().includes('permission') ||
                                  errorMsg.includes('403');
        
        if (!isPermissionError) {
          try {
            // Clean up failed attempt
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
            
            // Try front camera (user-facing)
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
            
            // Wait and check if it's actually working
            await new Promise(resolve => setTimeout(resolve, 500));
            const qrReaderElement2 = document.getElementById('qr-reader');
            if (qrReaderElement2 && scannerRef.current) {
              try {
                // Check if video element exists (indicates camera is actually running)
                const videoElement = qrReaderElement2.querySelector('video');
                if (videoElement && videoElement.readyState > 0) {
                  // Camera is actually working!
                  setCameraError(null);
                  setInitializing(false);
                  isInitializingRef.current = false;
                  return;
                }
              } catch (_) {
                // Continue to error handling
              }
            }
            
            // If we get here, both attempts failed
            throw startErr;
          } catch (err2) {
            // Both cameras failed - check if it's actually a permission issue
            const err2Msg = err2?.message || err2?.name || errorMsg;
            if (err2Msg.includes('NotAllowedError') || err2Msg.includes('Permission denied') || err2Msg.toLowerCase().includes('permission')) {
              throw err2; // Show permission error
            }
            throw startErr; // Re-throw original error
          }
        } else {
          // Permission error - show to user
          throw startErr;
        }
      }
    } catch (error) {
      // Handle all errors - but only show if scanner is definitely not working
      const errorMsg = error?.message || error?.name || 'Unknown error';
      
      // Double-check if scanner is actually running despite the error
      // Sometimes errors occur but camera still works
      if (scannerRef.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const qrReaderCheck = document.getElementById('qr-reader');
          if (qrReaderCheck) {
            const videoElement = qrReaderCheck.querySelector('video');
            if (videoElement && videoElement.readyState > 0 && !videoElement.paused) {
              // Camera is actually working! Don't show error
              setCameraError(null);
              setInitializing(false);
              isInitializingRef.current = false;
              return;
            }
          }
        } catch (_) {
          // Scanner check failed, continue with error
        }
      }
      
      // Only show error if it's a clear, specific error
      let userMessage = '';
      
      if (errorMsg.includes('NotAllowedError') || errorMsg.toLowerCase().includes('permission denied') || errorMsg.includes('403')) {
        userMessage = 'Camera permission denied. ';
        if (/Android/i.test(navigator.userAgent)) {
          userMessage += 'Please check: Browser Settings → Site Settings → Camera → Allow. Then refresh the page.';
        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          userMessage += 'Go to iPhone Settings → Safari → Camera → Allow. Then refresh the page.';
        } else {
          userMessage += 'Please allow camera access in your browser settings and refresh the page.';
        }
      } else if (errorMsg.includes('NotFoundError') && !errorMsg.toLowerCase().includes('qr')) {
        userMessage = 'No camera found on this device. Please use a device with a camera.';
      } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('busy')) {
        userMessage = 'Camera is being used by another app. Please close other camera apps and try again.';
      } else if (errorMsg.includes('InsecureContextError') || errorMsg.includes('HTTPS')) {
        userMessage = 'Camera access requires HTTPS. Please ensure the URL starts with https://';
      } else {
        // For generic errors, give helpful troubleshooting
        userMessage = 'Unable to start camera. ';
        userMessage += 'Please try: 1) Refresh the page 2) Allow camera permission 3) Check if other apps are using the camera.';
      }
      
      setCameraError(userMessage);
      toast.error(userMessage);
      setScanning(false);
    } finally {
      setInitializing(false);
      isInitializingRef.current = false;
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
                    disabled={initializing}
                  >
                    {initializing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Starting Camera...
                      </>
                    ) : (
                      <>
                        <FaCamera className="me-2" />
                        Try Again
                      </>
                    )}
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
                    disabled={initializing}
                  >
                    {initializing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Starting Camera...
                      </>
                    ) : (
                      <>
                        <FaCamera className="me-2" />
                        Start Scanning
                      </>
                    )}
                  </button>
                </div>
              )}

              {(scanning || initializing) && !cameraError && (
                <div className="text-center">
                  {initializing && !scannerRef.current && (
                    <div className="mb-3">
                      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading camera...</span>
                      </div>
                      <p className="text-muted">Initializing camera... Please allow camera access when prompted.</p>
                    </div>
                  )}
                  {!initializing && (
                    <>
                      <div className="scanner-container mb-3">
                        <div id="qr-reader"></div>
                      </div>
                      <p className="text-muted mb-2">Point your camera at the QR code</p>
                      <p className="text-success small mb-3">✓ Camera is ready! Scan the QR code now.</p>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={async () => {
                          try {
                            if (scannerRef.current) {
                              await scannerRef.current.stop();
                              scannerRef.current.clear();
                            }
                          } catch (_) {}
                          setScanning(false);
                          setResult(null);
                          isInitializingRef.current = false;
                        }}
                      >
                        Stop Scanning
                      </button>
                    </>
                  )}
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