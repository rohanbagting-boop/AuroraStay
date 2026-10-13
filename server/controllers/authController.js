import { body } from 'express-validator';
import { User } from '../models/User.js';
import { AppError, ok, created } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, hashToken, randomToken, setAuthCookie, setCsrfCookie, signToken } from '../utils/security.js';
import { audit } from '../services/auditService.js';
import { passwordRule } from '../validators/common.js';

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  passwordRule,
  body('phone').optional().isString().trim().isLength({ max: 40 })
];

export const loginRules = [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 1, max: 128 })];

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.validated;
  const user = await User.create({ name, email, password, phone, role: 'guest' });
  await audit(req, 'auth.register', 'User', user._id);
  setCsrfCookie(req, res);
  setAuthCookie(res, signToken(user));
  created(res, { user }, 'Registration successful.');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;
  const user = await User.findOne({ email, deletedAt: null }).select('+password +tokenVersion +passwordChangedAt');
  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Incorrect email and password. Please try again.', 'INVALID_CREDENTIALS');
  }
  setCsrfCookie(req, res);
  setAuthCookie(res, signToken(user));
  req.user = user;
  await audit(req, 'auth.login', 'User', user._id);
  ok(res, { user }, 'Login successful.');
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  ok(res, null, 'Logged out.');
});

export const me = asyncHandler(async (req, res) => {
  setCsrfCookie(req, res);
  ok(res, { user: req.user, csrfToken: req.cookies?.hotel_csrf });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email, deletedAt: null }).select('+resetPasswordHash +resetPasswordExpiresAt');
  if (user) {
    const token = randomToken();
    user.resetPasswordHash = hashToken(token);
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    await audit(req, 'auth.password_reset_requested', 'User', user._id);
    if (process.env.NODE_ENV !== 'production') {
      return ok(res, { developmentResetToken: token }, 'If the account exists, password reset instructions will be sent.');
    }
  }
  ok(res, null, 'If the account exists, password reset instructions will be sent.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || String(password).length > 128) throw new AppError(400, 'Invalid reset request.', 'INVALID_RESET');
  const user = await User.findOne({
    resetPasswordHash: hashToken(token),
    resetPasswordExpiresAt: { $gt: new Date() },
    deletedAt: null
  }).select('+resetPasswordHash +resetPasswordExpiresAt +password +tokenVersion');
  if (!user) throw new AppError(400, 'Invalid or expired reset token.', 'INVALID_RESET');
  user.password = password;
  user.resetPasswordHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
  req.user = user;
  await audit(req, 'auth.password_reset_completed', 'User', user._id);
  ok(res, null, 'Password reset complete. Please log in.');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (!(await user.comparePassword(currentPassword))) throw new AppError(403, 'Current password is incorrect.', 'BAD_PASSWORD');
  user.password = newPassword;
  await user.save();
  clearAuthCookie(res);
  await audit(req, 'auth.password_changed', 'User', user._id);
  ok(res, null, 'Password changed. Please log in again.');
});

