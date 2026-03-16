import axios from 'axios';

// Use different base URLs for dev vs production
const baseURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'
    : `${process.env.REACT_APP_API_URL || ''}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;

