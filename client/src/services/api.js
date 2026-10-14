import axios from 'axios';

let memoryCsrfToken = (typeof localStorage !== 'undefined' && localStorage.getItem('hotel_csrf_token')) || '';

export function setMemoryCsrf(token) {
  memoryCsrfToken = token || '';
  try {
    if (token) {
      localStorage.setItem('hotel_csrf_token', token);
    } else {
      localStorage.removeItem('hotel_csrf_token');
    }
  } catch {}
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedBaseUrl = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, '')}/api`;

export const api = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  let token = memoryCsrfToken;
  if (!token && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('hotel_csrf_token');
  }
  if (!token && typeof document !== 'undefined') {
    token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('hotel_csrf='))
      ?.split('=')[1];
    if (token) token = decodeURIComponent(token);
  }
  if (token) {
    config.headers['x-csrf-token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const headerToken = response.headers?.['x-csrf-token'];
    if (headerToken) setMemoryCsrf(headerToken);
    if (response.data?.data?.csrfToken) setMemoryCsrf(response.data.data.csrfToken);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const unwrap = (promise) => promise.then((res) => res.data.data);

