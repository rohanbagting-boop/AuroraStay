import { body } from 'express-validator';
import { Reservation } from '../models/Reservation.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { created, ok, AppError } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertCanCancel, assertStatusTransition, createReservation, findAvailableRooms, normalizeDate, nightsBetween } from '../services/reservationService.js';
import { audit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';

export const reservationRules = [
  body('roomType').isMongoId(),
  body('checkIn').isISO8601(),
  body('checkOut').isISO8601(),
  body('guests').isInt({ min: 1, max: 12 }),
  body('guestInfo.name').isString().trim().isLength({ min: 2, max: 80 }),
  body('guestInfo.email').isEmail().normalizeEmail(),
  body('guestInfo.phone').optional().isString().trim().isLength({ max: 40 }),
  body('specialRequests').optional().isString().trim().isLength({ max: 1000 }),
  body('idempotencyKey').optional().isString().trim().isLength({ min: 8, max: 120 })
];

const populate = (query) => query.populate('guest', 'name email phone role').populate('room');

export const createGuestReservation = asyncHandler(async (req, res) => {
  const reservation = await createReservation({ user: req.user, payload: req.validated, actor: req.user });
  await notify(req.user._id, 'reservation.confirmed', 'Reservation confirmed', `Booking ${reservation.bookingReference} is confirmed.`, reservation._id);
  await audit(req, 'reservation.create', 'Reservation', reservation._id);
  created(res, await populate(Reservation.findById(reservation._id)), 'Reservation created.');
});

export const createStaffReservation = asyncHandler(async (req, res) => {
  const guest = req.body.guestId ? await User.findById(req.body.guestId) : req.user;
  if (!guest) throw new AppError(404, 'Guest not found.', 'GUEST_NOT_FOUND');
  const reservation = await createReservation({ user: guest, payload: req.validated, actor: req.user });
  await audit(req, 'reservation.staff_create', 'Reservation', reservation._id);
  created(res, await populate(Reservation.findById(reservation._id)), 'Reservation created.');
});

export const myReservations = asyncHandler(async (req, res) => {
  ok(res, await populate(Reservation.find({ guest: req.user._id }).sort({ createdAt: -1 })));
});

export const listReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.from || req.query.to) {
    filter.checkIn = {};
    if (req.query.from) filter.checkIn.$gte = normalizeDate(req.query.from);
    if (req.query.to) filter.checkIn.$lte = normalizeDate(req.query.to);
  }
  if (req.query.q) filter.bookingReference = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  ok(res, await populate(Reservation.find(filter).sort({ createdAt: -1 }).limit(200)));
});

export const getReservation = asyncHandler(async (req, res) => {
  const reservation = await populate(Reservation.findById(req.params.id));
  if (!reservation) throw new AppError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  if (req.user.role === 'guest' && reservation.guest._id.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'You cannot access this reservation.', 'FORBIDDEN');
  }
  ok(res, reservation);
});

export const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new AppError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  if (req.user.role === 'guest') throw new AppError(403, 'Guests cannot edit reservations directly.', 'FORBIDDEN');
  const allowed = {};
  if (req.body.specialRequests !== undefined) allowed.specialRequests = String(req.body.specialRequests).slice(0, 1000);
  if (req.body.checkIn || req.body.checkOut || req.body.guests) {
    const checkIn = normalizeDate(req.body.checkIn || reservation.checkIn);
    const checkOut = normalizeDate(req.body.checkOut || reservation.checkOut);
    nightsBetween(checkIn, checkOut);
    const currentRoom = await Room.findById(reservation.room);
    const available = await findAvailableRooms({ roomType: currentRoom.roomType, checkIn, checkOut, guests: Number(req.body.guests || reservation.guests), excludeReservationId: reservation._id });
    if (!available.some((room) => room._id.toString() === reservation.room.toString())) throw new AppError(409, 'Current room is not available for the new dates.', 'NO_AVAILABILITY');
    allowed.checkIn = checkIn;
    allowed.checkOut = checkOut;
    allowed.guests = Number(req.body.guests || reservation.guests);
  }
  Object.assign(reservation, allowed);
  await reservation.save();
  await audit(req, 'reservation.update', 'Reservation', reservation._id);
  ok(res, await populate(Reservation.findById(reservation._id)), 'Reservation updated.');
});

export const changeStatus = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new AppError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  assertStatusTransition(reservation.status, req.body.status, req.user.role);
  reservation.status = req.body.status;
  if (req.body.status === 'checked-in') reservation.checkedInAt = new Date();
  if (req.body.status === 'checked-out') reservation.checkedOutAt = new Date();
  await reservation.save();
  await audit(req, `reservation.status.${req.body.status}`, 'Reservation', reservation._id);
  ok(res, await populate(Reservation.findById(reservation._id)), 'Reservation status updated.');
});

export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new AppError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  if (req.user.role === 'guest' && reservation.guest.toString() !== req.user._id.toString()) throw new AppError(403, 'Forbidden.', 'FORBIDDEN');
  await assertCanCancel(reservation);
  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date();
  reservation.cancellationReason = req.body.reason || 'Cancelled by user';
  await reservation.save();
  await audit(req, 'reservation.cancel', 'Reservation', reservation._id);
  ok(res, await populate(Reservation.findById(reservation._id)), 'Reservation cancelled.');
});

