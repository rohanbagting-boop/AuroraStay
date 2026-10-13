import { stringify } from 'csv-stringify/sync';
import { Reservation } from '../models/Reservation.js';
import { Room } from '../models/Room.js';
import { Payment } from '../models/Payment.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { HotelSettings } from '../models/HotelSettings.js';
import { ok } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const stats = asyncHandler(async (_req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const [totalReservations, reservationsToday, upcomingConfirmed, checkedIn, roomsByStatus, revenue, recentReservations, upcomingCheckins, statusDistribution] =
    await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Reservation.countDocuments({ status: 'confirmed', checkIn: { $gte: start } }),
      Reservation.countDocuments({ status: 'checked-in' }),
      Room.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Reservation.find().populate('guest', 'name email').populate('room').sort({ createdAt: -1 }).limit(8),
      Reservation.find({ status: 'confirmed', checkIn: { $gte: start } }).populate('guest', 'name email').populate('room').sort({ checkIn: 1 }).limit(8),
      Reservation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
  ok(res, { totalReservations, reservationsToday, upcomingConfirmed, checkedIn, roomsByStatus, revenue: revenue[0]?.total || 0, recentReservations, upcomingCheckins, statusDistribution });
});

export const reservationReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.from || req.query.to) {
    filter.checkIn = {};
    if (req.query.from) filter.checkIn.$gte = new Date(req.query.from);
    if (req.query.to) filter.checkIn.$lte = new Date(req.query.to);
  }
  ok(res, await Reservation.find(filter).populate('guest', 'name email').populate('room').sort({ checkIn: -1 }).limit(500));
});

export const revenueReport = asyncHandler(async (_req, res) => {
  const data = await Payment.aggregate([
    { $match: { status: { $in: ['paid', 'partially-refunded'] } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } }
  ]);
  ok(res, data);
});

export const exportReservations = asyncHandler(async (_req, res) => {
  const rows = await Reservation.find().populate('guest', 'name email').populate('room').sort({ createdAt: -1 }).limit(1000);
  const csv = stringify(
    rows.map((r) => ({
      bookingReference: r.bookingReference,
      guest: r.guest?.name,
      email: r.guest?.email,
      room: r.roomSnapshot?.roomNumber,
      checkIn: r.checkIn.toISOString().slice(0, 10),
      checkOut: r.checkOut.toISOString().slice(0, 10),
      status: r.status,
      paymentStatus: r.paymentStatus,
      total: r.price?.total
    })),
    { header: true }
  );
  res.setHeader('content-type', 'text/csv');
  res.setHeader('content-disposition', 'attachment; filename="reservations.csv"');
  res.send(csv);
});

export const settings = asyncHandler(async (_req, res) => ok(res, await HotelSettings.findOne()));
export const updateSettings = asyncHandler(async (req, res) => ok(res, await HotelSettings.findOneAndUpdate({}, req.body, { upsert: true, new: true, runValidators: true }), 'Settings updated.'));
export const notifications = asyncHandler(async (req, res) => ok(res, await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)));
export const auditLogs = asyncHandler(async (_req, res) => ok(res, await AuditLog.find().populate('actor', 'name email role').sort({ createdAt: -1 }).limit(200)));

