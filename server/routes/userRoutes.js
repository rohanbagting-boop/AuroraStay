import { Router } from 'express';
import { deleteUser, getUser, listUsers, setUserStatus, updateUser } from '../controllers/userController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/common.js';

export const userRoutes = Router();
userRoutes.use(requireAuth);
userRoutes.get('/', allowRoles('admin'), listUsers);
userRoutes.get('/:id', allowRoles('admin'), mongoIdParam(), validate, getUser);
userRoutes.put('/:id', mongoIdParam(), validate, updateUser);
userRoutes.patch('/:id/status', allowRoles('admin'), mongoIdParam(), validate, setUserStatus);
userRoutes.delete('/:id', allowRoles('admin'), mongoIdParam(), validate, deleteUser);

