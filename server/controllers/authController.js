import { body } from 'express-validator';
import { User } from '../models/User.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { AppError, ok, created } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, hashToken, randomToken, setAuthCookie, setCsrfCookie, signToken } from '../utils/security.js';
import { audit } from '../services/auditService.js';
import { sendOtpEmail } from '../services/emailService.js';
import { passwordRule } from '../validators/common.js';
import { env } from '../config/env.js';

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  passwordRule,
  body('phone').optional().isString().trim().isLength({ max: 40 })
];

export const verifyOtpRules = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isString().trim().isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits.')
];

export const resendOtpRules = [
  body('email').isEmail().normalizeEmail()
];

export const loginRules = [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 1, max: 128 })];

export const requestRegistrationOtp = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.validated;

  const existingUser = await User.findOne({ email, deletedAt: null });
  if (existingUser) {
    throw new AppError(409, 'An account with this email address already exists. Please sign in instead.', 'EMAIL_EXISTS');
  }

  const existingOtp = await OtpVerification.findOne({ email });
  if (existingOtp && existingOtp.resendCooldownUntil && existingOtp.resendCooldownUntil > new Date()) {
    const secondsLeft = Math.ceil((existingOtp.resendCooldownUntil - new Date()) / 1000);
    throw new AppError(429, `Please wait ${secondsLeft} seconds before requesting a new code.`, 'COOLDOWN_ACTIVE');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const resendCooldownUntil = new Date(Date.now() + 60 * 1000);

  await OtpVerification.findOneAndUpdate(
    { email },
    {
      email,
      otpHash,
      registrationData: { name, password, phone: phone || '' },
      attempts: 0,
      maxAttempts: 5,
      resendCooldownUntil,
      expiresAt
    },
    { upsert: true, new: true }
  );

  const emailResult = await sendOtpEmail(email, otp, name);

  ok(
    res,
    {
      email,
      resendCooldown: 60,
      expiresIn: 600,
      maxAttempts: 5,
      ...(process.env.NODE_ENV !== 'production' || !env.emailConfigured ? { developmentOtp: otp } : {})
    },
    'Verification code sent to your email.'
  );
});

export const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.validated;

  const record = await OtpVerification.findOne({ email });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError(400, 'Verification code has expired or was not requested. Please request a new code.', 'OTP_EXPIRED');
  }

  if (record.attempts >= record.maxAttempts) {
    await OtpVerification.deleteOne({ _id: record._id });
    throw new AppError(429, 'Too many failed attempts. This verification code has been invalidated. Please request a new code.', 'OTP_MAX_ATTEMPTS');
  }

  const isMatch = hashToken(otp) === record.otpHash;
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const remaining = record.maxAttempts - record.attempts;
    if (remaining <= 0) {
      await OtpVerification.deleteOne({ _id: record._id });
      throw new AppError(429, 'Invalid verification code. You have reached the maximum allowed attempts. Please request a new code.', 'OTP_MAX_ATTEMPTS');
    }
    throw new AppError(400, `Invalid verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`, 'OTP_INVALID');
  }

  const { name, password, phone } = record.registrationData;
  const user = await User.create({ name, email, password, phone, role: 'guest' });
  await OtpVerification.deleteOne({ _id: record._id });
  await audit(req, 'auth.register_otp_verified', 'User', user._id);
  const csrfToken = setCsrfCookie(req, res);
  setAuthCookie(res, signToken(user));

  created(res, { user, csrfToken }, 'Account created and verified successfully.');
});

export const resendRegistrationOtp = asyncHandler(async (req, res) => {
  const { email } = req.validated;

  const record = await OtpVerification.findOne({ email });
  if (!record) {
    throw new AppError(400, 'No active registration session found for this email. Please register again.', 'NO_SESSION');
  }

  if (record.resendCooldownUntil && record.resendCooldownUntil > new Date()) {
    const secondsLeft = Math.ceil((record.resendCooldownUntil - new Date()) / 1000);
    throw new AppError(429, `Please wait ${secondsLeft} seconds before requesting a new code.`, 'COOLDOWN_ACTIVE');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  record.otpHash = hashToken(otp);
  record.attempts = 0;
  record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  record.resendCooldownUntil = new Date(Date.now() + 60 * 1000);
  await record.save();

  await sendOtpEmail(email, otp, record.registrationData?.name);

  ok(
    res,
    {
      email,
      resendCooldown: 60,
      expiresIn: 600,
      maxAttempts: record.maxAttempts,
      ...(process.env.NODE_ENV !== 'production' || !env.emailConfigured ? { developmentOtp: otp } : {})
    },
    'A new verification code has been sent to your email.'
  );
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.validated;
  const user = await User.create({ name, email, password, phone, role: 'guest' });
  await audit(req, 'auth.register', 'User', user._id);
  const csrfToken = setCsrfCookie(req, res);
  setAuthCookie(res, signToken(user));
  created(res, { user, csrfToken }, 'Registration successful.');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;
  const user = await User.findOne({ email, deletedAt: null }).select('+password +tokenVersion +passwordChangedAt');
  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Incorrect email and password. Please try again.', 'INVALID_CREDENTIALS');
  }
  const csrfToken = setCsrfCookie(req, res);
  setAuthCookie(res, signToken(user));
  req.user = user;
  await audit(req, 'auth.login', 'User', user._id);
  ok(res, { user, csrfToken }, 'Login successful.');
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  ok(res, null, 'Logged out.');
});

export const me = asyncHandler(async (req, res) => {
  const csrfToken = setCsrfCookie(req, res);
  ok(res, { user: req.user, csrfToken });
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

