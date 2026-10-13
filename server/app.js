import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import { env } from './config/env.js';
import { requireCsrf } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import { rejectOperators } from './middleware/validate.js';
import { writeLimiter } from './middleware/rateLimits.js';
import { authRoutes } from './routes/authRoutes.js';
import { roomRoutes } from './routes/roomRoutes.js';
import { roomTypeRoutes } from './routes/roomTypeRoutes.js';
import { reservationRoutes } from './routes/reservationRoutes.js';
import { paymentRoutes } from './routes/paymentRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientOrigin.split(',').map((s) => s.trim()), credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(rejectOperators);
  app.use(mongoSanitize());
  app.use(writeLimiter);
  app.use(requireCsrf);
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Hotel API is healthy.' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/room-types', roomTypeRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api', dashboardRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

