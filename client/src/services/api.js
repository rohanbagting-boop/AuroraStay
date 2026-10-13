import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('hotel_csrf='))
    ?.split('=')[1];
  if (token) config.headers['x-csrf-token'] = decodeURIComponent(token);
  return config;
});

export const unwrap = (promise) => promise.then((res) => res.data.data);

