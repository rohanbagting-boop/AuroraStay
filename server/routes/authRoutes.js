import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  loginRules,
  logout,
  me,
  register,
  registerRules,
  requestRegistrationOtp,
  resendOtpRules,
  resendRegistrationOtp,
  resetPassword,
  verifyOtpRules,
  verifyRegistrationOtp
} from '../controllers/authController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';

export const authRoutes = Router();
authRoutes.post('/register', authLimiter, registerRules, validate, register);
authRoutes.post('/register/request-otp', authLimiter, registerRules, validate, requestRegistrationOtp);
authRoutes.post('/register/verify-otp', authLimiter, verifyOtpRules, validate, verifyRegistrationOtp);
authRoutes.post('/register/resend-otp', authLimiter, resendOtpRules, validate, resendRegistrationOtp);
authRoutes.post('/login', authLimiter, loginRules, validate, login);
authRoutes.post('/logout', optionalAuth, logout);
authRoutes.get('/me', requireAuth, me);
authRoutes.post('/forgot-password', authLimiter, forgotPassword);
authRoutes.post('/reset-password', authLimiter, resetPassword);
authRoutes.put('/password', requireAuth, changePassword);

