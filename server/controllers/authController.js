import { body } from 'express-validator';
import { User } from '../models/User.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { AppError, ok, created } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  clearAuthCookie,
  clearCsrfCookie,
  hashToken,
  randomToken,
  setAuthCookie,
  setCsrfCookie,
  signToken
} from '../utils/security.js';
import { audit } from '../services/auditService.js';
import { sendOtpEmail, sendPasswordResetEmail, sendPasswordResetOtpEmail } from '../services/emailService.js';
import { passwordRule } from '../validators/common.js';
import { env } from '../config/env.js';

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  passwordRule,
  body('phone')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .matches(/^\d{11}$/)
    .withMessage('Phone number must be exactly 11 digits and contain numbers only.')
];

export const verifyOtpRules = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isString().trim().isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits.')
];

export const resendOtpRules = [
  body('email').isEmail().normalizeEmail()
];

export const loginRules = [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 1, max: 128 })];

// Wrap a promise with a timeout fallback so email sending never blocks the response
const withTimeout = (promise, ms, fallback) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);

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

  const emailResult = await withTimeout(
    sendOtpEmail(email, otp, name),
    25000,
    { sent: false, devCode: otp, error: 'timeout' }
  );

  const message = emailResult.sent
    ? 'Verification code sent to your email.'
    : 'Could not send email. Use the verification code shown below to complete registration.';

  ok(
    res,
    {
      email,
      resendCooldown: 60,
      expiresIn: 600,
      maxAttempts: 5,
      ...(process.env.NODE_ENV === 'test' || !env.emailConfigured || !emailResult.sent ? { developmentOtp: otp } : {})
    },
    message
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

  const emailResult = await withTimeout(
    sendOtpEmail(email, otp, record.registrationData?.name),
    25000,
    { sent: false, devCode: otp, error: 'timeout' }
  );

  const message = emailResult.sent
    ? 'A new verification code has been sent to your email.'
    : 'Could not send email. Use the verification code shown below to complete registration.';

  ok(
    res,
    {
      email,
      resendCooldown: 60,
      expiresIn: 600,
      maxAttempts: record.maxAttempts,
      ...(process.env.NODE_ENV === 'test' || !env.emailConfigured || !emailResult.sent ? { developmentOtp: otp } : {})
    },
    message
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
  if (!user) {
    const pendingOtp = await OtpVerification.findOne({ email, expiresAt: { $gt: new Date() } });
    if (pendingOtp) {
      throw new AppError(
        403,
        'Your account registration is pending verification. Please enter the verification code sent to your email.',
        'REGISTRATION_UNVERIFIED'
      );
    }
    throw new AppError(401, 'Incorrect email and password. Please try again.', 'INVALID_CREDENTIALS');
  }
  if (!user.isActive || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Incorrect email and password. Please try again.', 'INVALID_CREDENTIALS');
  }
  const csrfToken = setCsrfCookie(req, res);
  setAuthCookie(res, signToken(user));
  req.user = user;
  await audit(req, 'auth.login', 'User', user._id);
  ok(res, { user, csrfToken }, 'Login successful.');
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    try {
      await audit(req, 'auth.logout', 'User', req.user._id);
    } catch {}
  }
  clearAuthCookie(res);
  clearCsrfCookie(res);
  ok(res, null, 'Logged out.');
});

export const me = asyncHandler(async (req, res) => {
  const csrfToken = setCsrfCookie(req, res);
  ok(res, { user: req.user, csrfToken });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!email) throw new AppError(400, 'Please enter your email address.', 'VALIDATION_ERROR');

  const user = await User.findOne({ email, deletedAt: null }).select('+resetPasswordHash +resetPasswordExpiresAt +password');
  if (!user) {
    return ok(res, { email, sent: true }, 'If an account exists, a 6-digit code has been sent.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordHash = hashToken(otp);
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await audit(req, 'auth.password_reset_code_requested', 'User', user._id);

  let emailResult = { sent: false, devCode: otp };
  try {
    emailResult = await withTimeout(
      sendPasswordResetOtpEmail(email, otp, user.name),
      25000,
      { sent: false, devCode: otp, error: 'Email timeout' }
    );
  } catch (err) {
    emailResult = { sent: false, devCode: otp, error: err.message };
  }

  const responseData = {
    email,
    sent: emailResult.sent
  };
  if (!emailResult.sent || env.nodeEnv !== 'production' || emailResult.devCode) {
    responseData.devCode = otp;
  }

  ok(res, responseData, 'A 6-digit reset code has been sent to your email.');
});

export const resendResetCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!email) throw new AppError(400, 'Please enter your email address.', 'VALIDATION_ERROR');

  const user = await User.findOne({ email, deletedAt: null }).select('+resetPasswordHash +resetPasswordExpiresAt');
  if (!user) {
    return ok(res, { email, sent: true }, 'If an account exists, a 6-digit code has been sent.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordHash = hashToken(otp);
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  let emailResult = { sent: false, devCode: otp };
  try {
    emailResult = await withTimeout(
      sendPasswordResetOtpEmail(email, otp, user.name),
      25000,
      { sent: false, devCode: otp, error: 'Email timeout' }
    );
  } catch (err) {
    emailResult = { sent: false, devCode: otp, error: err.message };
  }

  const responseData = {
    email,
    sent: emailResult.sent
  };
  if (!emailResult.sent || env.nodeEnv !== 'production' || emailResult.devCode) {
    responseData.devCode = otp;
  }

  ok(res, responseData, 'A new 6-digit code has been sent to your email.');
});

export const verifyResetCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const code = String(req.body.code || '').trim();

  if (!email || !code) {
    throw new AppError(400, 'Email and 6-digit code are required.', 'VALIDATION_ERROR');
  }

  const user = await User.findOne({
    email,
    deletedAt: null
  }).select('+resetPasswordHash +resetPasswordExpiresAt');

  if (
    !user ||
    !user.resetPasswordHash ||
    user.resetPasswordHash !== hashToken(code) ||
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt < new Date()
  ) {
    throw new AppError(400, 'Invalid or expired 6-digit code. Please request a new one.', 'INVALID_CODE');
  }

  // Issue temporary single-use reset session token
  const resetToken = randomToken();
  user.resetPasswordHash = hashToken(resetToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  ok(res, { resetToken, email }, 'Code verified successfully.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, currentPassword, newPassword } = req.body;
  if (!token || !newPassword || String(newPassword).length > 128) {
    throw new AppError(400, 'Invalid reset request.', 'INVALID_RESET');
  }

  const user = await User.findOne({
    resetPasswordHash: hashToken(token),
    resetPasswordExpiresAt: { $gt: new Date() },
    deletedAt: null
  }).select('+resetPasswordHash +resetPasswordExpiresAt +password +tokenVersion');

  if (!user) throw new AppError(400, 'Invalid or expired reset session. Please request a new code.', 'INVALID_RESET');

  if (!currentPassword) {
    throw new AppError(400, 'Please enter your current password.', 'CURRENT_PASSWORD_REQUIRED');
  }

  const isCurrentMatch = await user.comparePassword(currentPassword);
  if (!isCurrentMatch) {
    throw new AppError(400, 'Current password is incorrect.', 'INVALID_CURRENT_PASSWORD');
  }

  user.password = newPassword;
  user.resetPasswordHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
  req.user = user;
  await audit(req, 'auth.password_reset_completed', 'User', user._id);
  ok(res, null, 'Password reset complete. Please log in with your new password.');
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

