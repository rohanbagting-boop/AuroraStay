import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(values) {
    const { data } = await api.post('/auth/login', values);
    setUser(data.data.user);
    return data.data.user;
  }

  async function register(values) {
    const { data } = await api.post('/auth/register', values);
    setUser(data.data.user);
    return data.data.user;
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

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

