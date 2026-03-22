import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Fallback when running in Capacitor (APK); same default as config/api.js. Override with REACT_APP_API_BASE_URL.
const DEFAULT_API_ORIGIN = 'https://qr-based-attendance.onrender.com';

// API base URL selection:
// - Local dev: `/api` → CRA proxy
// - Production web (same origin as API): `/api`
// - Capacitor APK: absolute URL (relative `/api` does not resolve in WebView)
// - Any custom case: set REACT_APP_API_BASE_URL
const envBase = (process.env.REACT_APP_API_BASE_URL || '').trim();
const baseURL = envBase
  ? `${envBase.replace(/\/+$/, '')}/api`
  : Capacitor.isNativePlatform()
    ? `${DEFAULT_API_ORIGIN}/api`
    : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;

