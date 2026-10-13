import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Room } from '../models/Room.js';
import { RoomType } from '../models/RoomType.js';
import { Reservation } from '../models/Reservation.js';
import { HotelSettings } from '../models/HotelSettings.js';
import { AppError } from '../utils/http.js';
import { bookingReference } from '../utils/security.js';

const blockingStatuses = ['pending', 'confirmed', 'checked-in'];

export function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(400, 'Invalid date.', 'INVALID_DATE');
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function nightsBetween(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  const nights = Math.round(ms / 86400000);
  if (nights < 1) throw new AppError(400, 'Check-out must be later than check-in.', 'INVALID_DATES');
  return nights;
}

export async function calculatePrice(room, checkIn, checkOut) {
  const settings = await HotelSettings.findOne().lean();
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = Number((room.nightlyRate * nights).toFixed(2));
  const tax = Number((subtotal * (settings?.taxRate ?? env.taxRate)).toFixed(2));
  const serviceFee = Number((subtotal * (settings?.serviceFeeRate ?? env.serviceFeeRate)).toFixed(2));
  const total = Number((subtotal + tax + serviceFee).toFixed(2));
  return { nightlyRate: room.nightlyRate, nights, subtotal, tax, serviceFee, total, currency: 'PHP' };
}

export async function findAvailableRooms({ roomType, checkIn, checkOut, guests, excludeReservationId }, session) {
  const query = { isArchived: false, status: { $ne: 'maintenance' } };
  if (roomType) query.roomType = roomType;
  if (guests) query.capacity = { $gte: guests };
  const rooms = await Room.find(query).populate('roomType').session(session);
  const conflicts = await Reservation.find({
    room: { $in: rooms.map((room) => room._id) },
    status: { $in: blockingStatuses },
    ...(excludeReservationId ? { _id: { $ne: excludeReservationId } } : {}),
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  }).session(session);
  const taken = new Set(conflicts.map((reservation) => reservation.room.toString()));
  return rooms.filter((room) => !taken.has(room._id.toString()));
}

export async function createReservation({ user, payload, actor, session: externalSession }) {
  const run = async (session) => {
    const checkIn = normalizeDate(payload.checkIn);
    const checkOut = normalizeDate(payload.checkOut);
    if (checkIn < normalizeDate(new Date())) throw new AppError(400, 'Check-in cannot be in the past.', 'PAST_CHECK_IN');
    nightsBetween(checkIn, checkOut);
    if (payload.idempotencyKey) {
      const existing = await Reservation.findOne({ guest: user._id, idempotencyKey: payload.idempotencyKey }).session(session);
      if (existing) return existing;
    }

    const roomType = await RoomType.findById(payload.roomType).session(session);
    if (!roomType) throw new AppError(404, 'Room type not found.', 'ROOM_TYPE_NOT_FOUND');

    const available = await findAvailableRooms({ roomType: roomType._id, checkIn, checkOut, guests: payload.guests }, session);
    const room = available.sort((a, b) => a.nightlyRate - b.nightlyRate)[0];
    if (!room) throw new AppError(409, 'No rooms are available for the selected dates.', 'NO_AVAILABILITY');
    if (payload.guests > room.capacity) throw new AppError(400, 'Guest count exceeds room capacity.', 'OCCUPANCY_EXCEEDED');

    const price = await calculatePrice(room, checkIn, checkOut);
    const reservation = await Reservation.create(
      [
        {
          bookingReference: bookingReference(),
          guest: user._id,
          room: room._id,
          checkIn,
          checkOut,
          guests: payload.guests,
          status: actor?.role === 'guest' ? 'confirmed' : payload.status || 'confirmed',
          guestInfo: payload.guestInfo,
          specialRequests: payload.specialRequests,
          price,
          idempotencyKey: payload.idempotencyKey,
          roomSnapshot: {
            roomNumber: room.roomNumber,
            name: room.name,
            roomTypeName: roomType.name,
            capacity: room.capacity,
            bedType: room.bedType
          }
        }
      ],
      { session }
    );
    return reservation[0];
  };

  if (externalSession) return run(externalSession);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await run(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function assertCanCancel(reservation) {
  if (['cancelled', 'checked-in', 'checked-out', 'no-show'].includes(reservation.status)) {
    throw new AppError(400, 'This reservation cannot be cancelled.', 'CANNOT_CANCEL');
  }
  const settings = await HotelSettings.findOne().lean();
  const hours = settings?.cancellationHours ?? env.cancellationHours;
  if (reservation.checkIn.getTime() - Date.now() < hours * 60 * 60 * 1000) {
    throw new AppError(400, 'Cancellation period has passed.', 'CANCELLATION_CLOSED');
  }
}

export function assertStatusTransition(from, to, role) {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['checked-in', 'cancelled', 'no-show'],
    'checked-in': ['checked-out'],
    'checked-out': [],
    cancelled: [],
    'no-show': []
  };
  if (role === 'guest') throw new AppError(403, 'Guests cannot change reservation status directly.', 'FORBIDDEN');
  if (!transitions[from]?.includes(to)) throw new AppError(400, `Invalid status transition from ${from} to ${to}.`, 'INVALID_STATUS_TRANSITION');
}

