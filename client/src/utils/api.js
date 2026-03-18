import axios from 'axios';

// Single-service deployment:
// - Production: same origin `/api`
// - Development: CRA proxy forwards `/api` to backend (see client/package.json "proxy")
const baseURL = '/api';

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;

