// src/api/axios.js
import axios from 'axios';

// Your Django backend URL
const baseURL = 'http://50.17.86.95/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔹 Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Case 1: user info unauthorized — skip refresh to prevent loop
    if (error.response?.status === 401 && originalRequest.url.includes('/users/me/')) {
      console.log("Unauthorized user info call — skipping refresh.");
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return Promise.reject(error);
    }

    // Case 2: Access token expired, try refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error("No refresh token");

        const rs = await axios.post(`${baseURL}/token/refresh/`, { refresh: refreshToken });
        const { access } = rs.data;
        localStorage.setItem('accessToken', access);
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch (_error) {
        console.log('Session expired, logging out.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        window.location.href = '/auth';
        return Promise.reject(_error);
      }
    }

    // Case 3: Other errors
    return Promise.reject(error);
  }
);

export default api;
