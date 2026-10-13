import { body, param, query } from 'express-validator';

export const mongoIdParam = (name = 'id') => param(name).isMongoId().withMessage(`Invalid ${name}.`);
export const pagination = [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })];

export const passwordRule = body('password')
  .isString()
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be at least 8 characters long.')
  .matches(/[a-z]/)
  .withMessage('Password must include at least one lowercase letter.')
  .matches(/[A-Z]/)
  .withMessage('Password must include at least one uppercase letter.')
  .matches(/[0-9]/)
  .withMessage('Password must include at least one number.');

