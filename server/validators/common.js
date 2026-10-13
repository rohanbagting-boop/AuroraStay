import { body, param, query } from 'express-validator';

export const mongoIdParam = (name = 'id') => param(name).isMongoId().withMessage(`Invalid ${name}.`);
export const pagination = [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })];

export const passwordRule = body('password')
  .isString()
  .isLength({ min: 10, max: 128 })
  .withMessage('Password must be between 10 and 128 characters.')
  .matches(/[a-z]/)
  .matches(/[A-Z]/)
  .matches(/[0-9]/)
  .withMessage('Password must include uppercase, lowercase, and number characters.');

