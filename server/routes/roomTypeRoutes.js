import { Router } from 'express';
import { createRoomType, deleteRoomType, listRoomTypes, roomTypeRules, updateRoomType } from '../controllers/roomTypeController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/common.js';

export const roomTypeRoutes = Router();
roomTypeRoutes.get('/', listRoomTypes);
roomTypeRoutes.post('/', requireAuth, allowRoles('admin'), roomTypeRules, validate, createRoomType);
roomTypeRoutes.put('/:id', requireAuth, allowRoles('admin'), mongoIdParam(), roomTypeRules, validate, updateRoomType);
roomTypeRoutes.delete('/:id', requireAuth, allowRoles('admin'), mongoIdParam(), validate, deleteRoomType);

