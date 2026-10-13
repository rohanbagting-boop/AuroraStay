import { Router } from 'express';
import { createPayment, getPayment, listPayments, paymentRules } from '../controllers/paymentController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/common.js';

export const paymentRoutes = Router();
paymentRoutes.use(requireAuth, allowRoles('admin', 'receptionist'));
paymentRoutes.post('/', paymentRules, validate, createPayment);
paymentRoutes.get('/', listPayments);
paymentRoutes.get('/:id', mongoIdParam(), validate, getPayment);

