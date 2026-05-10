import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5000/api'),
});

// Auto-attach the token from local storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tlfq_platform_session');
  // Strict check for valid token strings
  if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Ensure no stale header is sent
    delete config.headers.Authorization;
  }
  return config;
});

export default api;
