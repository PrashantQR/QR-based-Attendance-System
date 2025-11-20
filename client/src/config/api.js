// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://qr-based-attendance.onrender.com';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export { API_BASE_URL };
export default API_BASE_URL;
