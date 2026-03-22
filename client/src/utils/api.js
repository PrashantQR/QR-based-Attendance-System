import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Fallback when running in Capacitor (APK); same default as config/api.js. Override with REACT_APP_API_BASE_URL.
const DEFAULT_API_ORIGIN = 'https://qr-based-attendance.onrender.com';

/**
 * Capacitor.isNativePlatform() can be false briefly or in edge builds; the WebView still loads from
 * https://localhost / capacitor:// — relative `/api` then hits https://localhost/api (nothing listening).
 */
function isEmbeddedAppShell() {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === 'undefined') return false;

  const { protocol, hostname, port } = window.location;
  if (protocol === 'capacitor:' || protocol === 'ionic:') return true;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return false;
  // CRA dev uses http://localhost:3000 + proxy — keep relative /api
  if (protocol === 'http:' && port === '3000') return false;
  return true;
}

function resolveBaseURL() {
  const envBase = (process.env.REACT_APP_API_BASE_URL || '').trim();
  if (envBase) {
    return `${envBase.replace(/\/+$/, '')}/api`;
  }

  // Local `npm start` — always use dev proxy
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }

  if (typeof window !== 'undefined') {
    const isCraDev =
      window.location.hostname === 'localhost' &&
      window.location.port === '3000' &&
      window.location.protocol === 'http:';
    if (!isCraDev && isEmbeddedAppShell()) {
      return `${DEFAULT_API_ORIGIN}/api`;
    }
  } else if (Capacitor.isNativePlatform()) {
    return `${DEFAULT_API_ORIGIN}/api`;
  }

  // Production web (e.g. same host as API on Render)
  return '/api';
}

const baseURL = resolveBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 45_000
});

export default api;
