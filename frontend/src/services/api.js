import axios from 'axios';

// In a production Vite build, import.meta.env.PROD is true.
// VITE_API_URL can be set in Vercel environment variables to override.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://invertis-feedback-system-1.onrender.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({ baseURL });

// Auto-attach the token from local storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tlfq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
