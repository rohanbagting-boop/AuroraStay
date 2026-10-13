import { Router } from 'express';
import { availability, availabilityRules, createRoom, deleteRoom, getRoom, listRooms, roomRules, updateRoom } from '../controllers/roomController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam, pagination } from '../validators/common.js';

export const roomRoutes = Router();
roomRoutes.get('/availability', availabilityRules, validate, availability);
roomRoutes.get('/', pagination, validate, listRooms);
roomRoutes.get('/:id', mongoIdParam(), validate, getRoom);
roomRoutes.post('/', requireAuth, allowRoles('admin'), roomRules, validate, createRoom);
roomRoutes.put('/:id', requireAuth, allowRoles('admin'), mongoIdParam(), roomRules, validate, updateRoom);
roomRoutes.delete('/:id', requireAuth, allowRoles('admin'), mongoIdParam(), validate, deleteRoom);

