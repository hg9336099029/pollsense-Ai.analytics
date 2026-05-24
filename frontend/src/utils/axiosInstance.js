import axios from 'axios';

const envBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const axiosInstance = axios.create({
  baseURL: envBase,
  withCredentials: true,
});

// If a request supplies a full URL (starts with http) remove baseURL so axios won't prepend it
axiosInstance.interceptors.request.use(config => {
  // if (config && config.url && /^https?:\/\//i.test(config.url)) {
  //   baseURL = { ...config, baseURL: undefined }
  // }

  // Add Authorization header if token exists
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, err => Promise.reject(err));

axiosInstance.interceptors.response.use(
  resp => resp,
  err => {
    // Log a compact error for debugging in browser console
    if (err && err.config) {
      console.error('axios response error:', {
        status: err.response && err.response.status,
        url: err.config.url,
        baseURL: err.config.baseURL,
        data: err.response && err.response.data
      });
    } else {
      console.error('axios error:', err && err.message);
    }
    return Promise.reject(err);
  }
);

export { axiosInstance };
export const axioscreatepoll = axiosInstance;