import { body } from 'express-validator';
import { RoomType } from '../models/RoomType.js';
import { AppError, created, ok } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/auditService.js';

export const roomTypeRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('description').isString().trim().isLength({ min: 10, max: 1200 }),
  body('baseRate').isFloat({ min: 0 }),
  body('amenities').optional().isArray({ max: 40 }),
  body('isActive').optional().isBoolean()
];

export const listRoomTypes = asyncHandler(async (_req, res) => ok(res, await RoomType.find().sort('baseRate')));
export const createRoomType = asyncHandler(async (req, res) => {
  const item = await RoomType.create(req.validated);
  await audit(req, 'room_type.create', 'RoomType', item._id);
  created(res, item, 'Room type created.');
});
export const updateRoomType = asyncHandler(async (req, res) => {
  const item = await RoomType.findByIdAndUpdate(req.params.id, req.validated, { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Room type not found.', 'ROOM_TYPE_NOT_FOUND');
  await audit(req, 'room_type.update', 'RoomType', item._id);
  ok(res, item, 'Room type updated.');
});
export const deleteRoomType = asyncHandler(async (req, res) => {
  const item = await RoomType.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!item) throw new AppError(404, 'Room type not found.', 'ROOM_TYPE_NOT_FOUND');
  await audit(req, 'room_type.deactivate', 'RoomType', item._id);
  ok(res, item, 'Room type deactivated.');
});

