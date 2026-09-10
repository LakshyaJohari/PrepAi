import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim();
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
if (!rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}

const api = axios.create({
  baseURL: rawBaseUrl,
});

// Add a request interceptor to add the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prepai-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle token expiration/logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('prepai-token');
      // We don't want to force redirect here as it might cause infinite loops,
      // better handled in the UI/authStore
    }
    return Promise.reject(error);
  }
);

export default api;
