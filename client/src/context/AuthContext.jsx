import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setMemoryCsrf } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      if (data.data?.csrfToken) setMemoryCsrf(data.data.csrfToken);
    } catch {
      setUser(null);
      try {
        const { data: csrfData } = await api.get('/auth/csrf');
        if (csrfData.data?.csrfToken) setMemoryCsrf(csrfData.data.csrfToken);
      } catch {}
    } finally {
      setLoading(false);
    }
  }

  async function login(values) {
    const { data } = await api.post('/auth/login', values);
    setUser(data.data.user);
    if (data.data?.csrfToken) setMemoryCsrf(data.data.csrfToken);
    return data.data.user;
  }

  async function register(values) {
    const { data } = await api.post('/auth/register', values);
    setUser(data.data.user);
    if (data.data?.csrfToken) setMemoryCsrf(data.data.csrfToken);
    return data.data.user;
  }

  async function requestOtp(values) {
    const { data } = await api.post('/auth/register/request-otp', values);
    return data;
  }

  async function verifyOtp({ email, otp }) {
    const { data } = await api.post('/auth/register/verify-otp', { email, otp });
    setUser(data.data.user);
    if (data.data?.csrfToken) setMemoryCsrf(data.data.csrfToken);
    return data.data.user;
  }

  async function resendOtp(email) {
    const { data } = await api.post('/auth/register/resend-otp', { email });
    return data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API failed, but clearing local state.', e);
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, requestOtp, verifyOtp, resendOtp, logout, refresh }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

