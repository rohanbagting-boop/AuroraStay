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

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required.', 'AUTH_REQUIRED'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to perform this action.', 'FORBIDDEN'));
  next();
};

export function requireCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'].includes(req.path)) return next();
  const cookie = req.cookies?.[csrfCookieName];
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie !== header) return next(new AppError(403, 'Invalid CSRF token.', 'CSRF_INVALID'));
  next();
}

