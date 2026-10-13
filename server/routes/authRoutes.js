import { Router } from 'express';
import { changePassword, forgotPassword, login, loginRules, logout, me, register, registerRules, resetPassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';

export const authRoutes = Router();
authRoutes.post('/register', authLimiter, registerRules, validate, register);
authRoutes.post('/login', authLimiter, loginRules, validate, login);
authRoutes.post('/logout', requireAuth, logout);
authRoutes.get('/me', requireAuth, me);
authRoutes.post('/forgot-password', authLimiter, forgotPassword);
authRoutes.post('/reset-password', authLimiter, resetPassword);
authRoutes.put('/password', requireAuth, changePassword);

