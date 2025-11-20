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
      // Don't catch errors immediately - let the scanner try to start
      let startError = null;
      
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
      } catch (startErr) {
        // Store error but don't throw yet - check if camera actually started
        startError = startErr;
      }
      
      // Wait longer for camera to initialize (give it time)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if camera is actually working (video element exists and is playing)
      const qrReaderCheck = document.getElementById('qr-reader');
      let cameraIsWorking = false;
      
      if (qrReaderCheck && scannerRef.current) {
        try {
          const videoElement = qrReaderCheck.querySelector('video');
          if (videoElement) {
            // Multiple checks to verify camera is working
            const hasStream = videoElement.srcObject !== null;
            const isReady = videoElement.readyState >= 1; // HAVE_METADATA or higher
            const isNotPaused = !videoElement.paused;
            const hasDimensions = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
            
            // If ANY of these are true, camera is likely working
            if (hasStream || isReady || isNotPaused || hasDimensions) {
              cameraIsWorking = true;
            }
          }
        } catch (_) {
          // Check failed, continue
        }
      }
      
      // If camera is working, clear errors and return success
      if (cameraIsWorking) {
        setCameraError(null);
        setInitializing(false);
        isInitializingRef.current = false;
        return;
      }
      
      // If camera didn't start and we got an error, try front camera
      if (startError && !cameraIsWorking) {
        const errorMsg = startError?.message || startError?.name || '';
        const isPermissionError = errorMsg.includes('NotAllowedError') || 
                                  errorMsg.includes('Permission denied') || 
                                  errorMsg.includes('403');
        
        // Only try front camera if it's NOT a permission error
        if (!isPermissionError) {
          try {
            // Clean up and try front camera
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
            try {
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
            } catch (_) {
              // Ignore error, check if camera works anyway
            }
            
            // Wait and verify front camera is working
            await new Promise(resolve => setTimeout(resolve, 2000));
            const qrReaderCheck2 = document.getElementById('qr-reader');
            if (qrReaderCheck2) {
              const videoElement2 = qrReaderCheck2.querySelector('video');
              if (videoElement2) {
                const hasStream2 = videoElement2.srcObject !== null;
                const isReady2 = videoElement2.readyState >= 1;
                const isNotPaused2 = !videoElement2.paused;
                const hasDimensions2 = videoElement2.videoWidth > 0 && videoElement2.videoHeight > 0;
                
                if (hasStream2 || isReady2 || isNotPaused2 || hasDimensions2) {
                  cameraIsWorking = true;
                }
              }
            }
            
            if (cameraIsWorking) {
              setCameraError(null);
              setInitializing(false);
              isInitializingRef.current = false;
              return;
            }
          } catch (_) {
            // Front camera failed, continue to error handling
          }
        }
        
        // If we get here, both cameras failed - throw original error
        throw startError;
      }
      
      // If camera is working, success!
      if (cameraIsWorking) {
        setCameraError(null);
        setInitializing(false);
        isInitializingRef.current = false;
        return;
      }
      
      // If camera didn't work and we have an error, throw it for error handling
      if (startError) {
        throw startError;
      }
      
      // If no error and camera isn't working, something unexpected happened
      // Wait a bit more and check again before showing error
      await new Promise(resolve => setTimeout(resolve, 1000));
      const finalCheck = document.getElementById('qr-reader');
      if (finalCheck) {
        const finalVideo = finalCheck.querySelector('video');
        if (finalVideo && (finalVideo.srcObject || finalVideo.readyState > 0)) {
          // Camera is actually working now!
          setCameraError(null);
          setInitializing(false);
          isInitializingRef.current = false;
          return;
        }
      }
      
      // Last resort - throw generic error
      throw new Error('Camera failed to start');
    } catch (error) {
      // Wait even longer to verify if camera is actually working
      // Many errors are thrown even when camera works, especially on mobile
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Final check - verify camera is actually not working
      // Only show error if we're absolutely certain camera is NOT working
      let cameraIsWorking = false;
      const qrReaderFinalCheck = document.getElementById('qr-reader');
      if (qrReaderFinalCheck && scannerRef.current) {
        try {
          const videoElement = qrReaderFinalCheck.querySelector('video');
          if (videoElement) {
            // Check multiple indicators that camera is working - be very lenient
            const hasStream = videoElement.srcObject !== null;
            const isReady = videoElement.readyState >= 1; // Any readyState is good
            const isNotPaused = !videoElement.paused;
            const hasVideo = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
            const hasCurrentTime = videoElement.currentTime > 0;
            
            // If ANY indicator shows camera might be working, assume it's working
            if (hasStream || isReady || isNotPaused || hasVideo || hasCurrentTime) {
              cameraIsWorking = true;
            }
            
            // Also check if video element exists and is in the DOM - that's a good sign
            if (videoElement && videoElement.parentNode) {
              // Video exists in DOM - might be working even if other checks fail
              // Wait a bit more and check readyState again
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (videoElement.readyState > 0 || videoElement.srcObject) {
                cameraIsWorking = true;
              }
            }
          }
        } catch (_) {
          // Check failed - don't assume camera is not working, just continue
        }
      }
      
      // If camera is actually working (or might be working), don't show error
      if (cameraIsWorking) {
        setCameraError(null);
        setInitializing(false);
        isInitializingRef.current = false;
        return;
      }
      
      // Camera is definitely not working - show appropriate error
      const errorMsg = error?.message || error?.name || 'Unknown error';
      let userMessage = '';
      
      if (errorMsg.includes('NotAllowedError') || errorMsg.toLowerCase().includes('permission denied') || errorMsg.includes('403')) {
        userMessage = 'Camera permission is required. ';
        if (/Android/i.test(navigator.userAgent)) {
          userMessage += 'Please: 1) Tap the camera icon 🔒 in the address bar 2) Select "Allow" 3) Refresh the page and try again.';
        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          userMessage += 'Please: 1) Go to iPhone Settings → Safari → Camera → Allow 2) Refresh the page and try again.';
        } else {
          userMessage += 'Please allow camera access in browser settings, then refresh and try again.';
        }
      } else if (errorMsg.includes('NotFoundError') && !errorMsg.toLowerCase().includes('qr')) {
        userMessage = 'No camera found. Please use a device with a camera.';
      } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('busy')) {
        userMessage = 'Camera is being used by another app. Please close other camera apps and try again.';
      } else if (errorMsg.includes('InsecureContextError') || errorMsg.includes('HTTPS')) {
        userMessage = 'Camera requires HTTPS. Please ensure the URL starts with https://';
      } else {
        // Generic error - provide troubleshooting steps
        userMessage = 'Camera access issue. Please try: 1) Refresh the page 2) Ensure camera permission is allowed 3) Check if other apps are using the camera 4) Try again.';
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