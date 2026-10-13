import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/http.js';
import { authCookieName, csrfCookieName } from '../utils/security.js';

export async function requireAuth(req, _res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    const token = req.cookies?.[authCookieName] || bearer;
    if (!token) throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('+tokenVersion +passwordChangedAt');
    if (!user || !user.isActive || user.deletedAt) throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    if ((user.tokenVersion || 0) !== payload.tokenVersion) throw new AppError(401, 'Session expired.', 'SESSION_EXPIRED');
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new AppError(401, 'Session expired.', 'SESSION_EXPIRED');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError(401, 'Authentication required.', 'AUTH_REQUIRED'));
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    const token = req.cookies?.[authCookieName] || bearer;
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('+tokenVersion +passwordChangedAt');
    if (user && user.isActive && !user.deletedAt && (user.tokenVersion || 0) === payload.tokenVersion) {
      req.user = user;
    }
  } catch {}
  next();
}

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required.', 'AUTH_REQUIRED'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to perform this action.', 'FORBIDDEN'));
  next();
};

export function requireCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path.startsWith('/api/auth/')) return next();

  if (req.headers.authorization?.startsWith('Bearer ')) return next();

  const cookie = req.cookies?.[csrfCookieName];
  const header = req.get('x-csrf-token');

  // Double-submit cookie match
  if (cookie && header && cookie === header) return next();

  // Allowed origin check (e.g. Vercel deployment or localhost)
  const origin = req.get('origin');
  const explicitOrigins = env.clientOrigin ? env.clientOrigin.split(',').map((s) => s.trim()) : [];
  const isAllowedOrigin = origin && (
    explicitOrigins.includes(origin) ||
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin)
  );

  if (isAllowedOrigin && (header || req.is('application/json'))) {
    return next();
  }

  if (!cookie || !header || cookie !== header) return next(new AppError(403, 'Invalid CSRF token.', 'CSRF_INVALID'));
  next();
}

