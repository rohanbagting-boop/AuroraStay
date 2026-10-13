import mongoose from 'mongoose';
import { AppError } from '../utils/http.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Unexpected server error';
  let code = err.code || 'SERVER_ERROR';

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
    code = 'VALIDATION_ERROR';
  }
  if (err?.code === 11000) {
    statusCode = 409;
    message = 'A record with the same unique value already exists.';
    code = 'DUPLICATE_KEY';
  }
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid record identifier.';
    code = 'INVALID_ID';
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && env.nodeEnv === 'production' ? 'Unexpected server error' : message,
    code,
    ...(env.nodeEnv !== 'production' && statusCode === 500 ? { stack: err.stack } : {})
  });
}

