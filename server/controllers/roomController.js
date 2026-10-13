import { body, query } from 'express-validator';
import { Room } from '../models/Room.js';
import { Reservation } from '../models/Reservation.js';
import { AppError, created, ok } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/auditService.js';
import { findAvailableRooms, normalizeDate, nightsBetween } from '../services/reservationService.js';
import { pick } from '../middleware/validate.js';

export const roomRules = [
  body('roomNumber').isString().trim().isLength({ min: 1, max: 20 }),
  body('name').isString().trim().isLength({ min: 2, max: 120 }),
  body('roomType').isMongoId(),
  body('floor').isInt({ min: 0 }),
  body('capacity').isInt({ min: 1, max: 12 }),
  body('bedType').isString().trim().isLength({ min: 2, max: 80 }),
  body('sizeSqm').optional().isInt({ min: 1 }),
  body('nightlyRate').isFloat({ min: 0 }),
  body('amenities').optional().isArray({ max: 40 }),
  body('description').isString().trim().isLength({ min: 20, max: 1600 }),
  body('images').optional().isArray({ max: 12 }),
  body('status').optional().isIn(['available', 'occupied', 'cleaning', 'maintenance'])
];

export const listRooms = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 12), 100);
  const filter = { isArchived: false };
  if (req.query.roomType) filter.roomType = req.query.roomType;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.nightlyRate = {};
    if (req.query.minPrice) filter.nightlyRate.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.nightlyRate.$lte = Number(req.query.maxPrice);
  }
  if (req.query.guests) filter.capacity = { $gte: Number(req.query.guests) };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  const sort = req.query.sort === 'price-desc' ? { nightlyRate: -1 } : req.query.sort === 'price-asc' ? { nightlyRate: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Room.find(filter).populate('roomType').sort(sort).skip((page - 1) * limit).limit(limit),
    Room.countDocuments(filter)
  ]);
  ok(res, items, 'Rooms loaded.', 200, { page, limit, total });
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id, isArchived: false }).populate('roomType');
  if (!room) throw new AppError(404, 'Room not found.', 'ROOM_NOT_FOUND');
  ok(res, room);
});

export const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.validated);
  await audit(req, 'room.create', 'Room', room._id);
  created(res, room, 'Room created.');
});

export const updateRoom = asyncHandler(async (req, res) => {
  const allowed = pick(req.validated, ['roomNumber', 'name', 'roomType', 'floor', 'capacity', 'bedType', 'sizeSqm', 'nightlyRate', 'amenities', 'description', 'images', 'status']);
  const room = await Room.findById(req.params.id);
  if (!room || room.isArchived) throw new AppError(404, 'Room not found.', 'ROOM_NOT_FOUND');
  if (allowed.status === 'maintenance') {
    const active = await Reservation.exists({ room: room._id, status: { $in: ['pending', 'confirmed', 'checked-in'] } });
    if (active) throw new AppError(409, 'Cannot set room to maintenance while active reservations exist.', 'ACTIVE_RESERVATIONS');
  }
  Object.assign(room, allowed);
  await room.save();
  await audit(req, 'room.update', 'Room', room._id);
  ok(res, room, 'Room updated.');
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room || room.isArchived) throw new AppError(404, 'Room not found.', 'ROOM_NOT_FOUND');
  const hasHistory = await Reservation.exists({ room: room._id });
  if (hasHistory) {
    room.isArchived = true;
    await room.save();
    await audit(req, 'room.archive', 'Room', room._id);
    return ok(res, room, 'Room archived because historical records exist.');
  }
  await room.deleteOne();
  await audit(req, 'room.delete', 'Room', room._id);
  ok(res, null, 'Room deleted.');
});

export const availabilityRules = [
  query('roomType').optional().isMongoId(),
  query('checkIn').isISO8601(),
  query('checkOut').isISO8601(),
  query('guests').optional().isInt({ min: 1, max: 12 })
];

export const availability = asyncHandler(async (req, res) => {
  const checkIn = normalizeDate(req.query.checkIn);
  const checkOut = normalizeDate(req.query.checkOut);
  nightsBetween(checkIn, checkOut);
  const rooms = await findAvailableRooms({ roomType: req.query.roomType, checkIn, checkOut, guests: Number(req.query.guests || 1) });
  ok(res, rooms, 'Available rooms loaded.');
});

