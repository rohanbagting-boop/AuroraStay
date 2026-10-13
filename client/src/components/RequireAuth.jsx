import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><div className="loader">Loading</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Redirects already-logged-in users away from guest-only pages (login, register, etc.)
export function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><div className="loader">Loading</div></div>;
  if (user) {
    if (user.role === 'admin' || user.role === 'receptionist') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/account" replace />;
  }
  return children;
}

