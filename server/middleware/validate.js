import { validationResult, matchedData } from 'express-validator';
import { AppError } from '../utils/http.js';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new AppError(400, result.array().map((e) => e.msg).join(', '), 'VALIDATION_ERROR'));
  }
  req.validated = matchedData(req, { locations: ['body', 'params', 'query'], includeOptionals: false });
  next();
}

export function rejectOperators(req, _res, next) {
  const inspect = (value) => {
    if (!value || typeof value !== 'object') return false;
    return Object.keys(value).some((key) => key.startsWith('$') || key.includes('.') || inspect(value[key]));
  };
  if (inspect(req.body) || inspect(req.query) || inspect(req.params)) {
    return next(new AppError(400, 'Unsafe query operators are not allowed.', 'UNSAFE_OPERATOR'));
  }
  next();
}

export const pick = (source, fields) =>
  fields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) acc[field] = source[field];
    return acc;
  }, {});

