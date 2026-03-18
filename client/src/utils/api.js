import axios from 'axios';

// API base URL selection:
// - Same-origin deployments (Render single service): leave unset and use `/api`
// - Split deployments (e.g. frontend on Vercel, backend on Render): set
//   REACT_APP_API_BASE_URL to your backend origin, e.g. `https://your-backend.onrender.com`
const envBase = (process.env.REACT_APP_API_BASE_URL || '').trim();
const baseURL = envBase ? `${envBase.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;

