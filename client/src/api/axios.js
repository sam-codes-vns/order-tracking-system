import axios from 'axios';

const baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// ✅ ADD THIS DEBUG LINE
console.log('🔍 DEBUG: VITE_SERVER_URL =', import.meta.env.VITE_SERVER_URL);
console.log('🔍 DEBUG: baseURL =', baseURL);
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
