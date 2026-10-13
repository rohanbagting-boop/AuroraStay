import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';

export const csrfCookieName = 'hotel_csrf';
export const authCookieName = 'hotel_token';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion || 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 2 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(authCookieName, { path: '/' });
}

export function setCsrfCookie(req, res) {
  const token = req.cookies?.[csrfCookieName] || nanoid(32);
  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 2 * 60 * 60 * 1000,
    path: '/'
  });
  if (res && res.setHeader) {
    res.setHeader('X-CSRF-Token', token);
  }
  return token;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function bookingReference() {
  return `AS-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
}

export function safeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

