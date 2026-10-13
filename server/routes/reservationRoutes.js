import { Router } from 'express';
import { body } from 'express-validator';
import { cancelReservation, changeStatus, createGuestReservation, createStaffReservation, getReservation, listReservations, myReservations, reservationRules, updateReservation } from '../controllers/reservationController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/common.js';

export const reservationRoutes = Router();
reservationRoutes.post('/', requireAuth, reservationRules, validate, createGuestReservation);
reservationRoutes.post('/staff', requireAuth, allowRoles('admin', 'receptionist'), reservationRules, validate, createStaffReservation);
reservationRoutes.get('/my', requireAuth, myReservations);
reservationRoutes.get('/', requireAuth, allowRoles('admin', 'receptionist'), listReservations);
reservationRoutes.get('/:id', requireAuth, mongoIdParam(), validate, getReservation);
reservationRoutes.put('/:id', requireAuth, allowRoles('admin', 'receptionist'), mongoIdParam(), validate, updateReservation);
reservationRoutes.patch('/:id/status', requireAuth, allowRoles('admin', 'receptionist'), mongoIdParam(), body('status').isIn(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show']), validate, changeStatus);
reservationRoutes.patch('/:id/cancel', requireAuth, mongoIdParam(), validate, cancelReservation);

