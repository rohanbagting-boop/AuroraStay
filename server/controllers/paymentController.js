import { body } from 'express-validator';
import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import { AppError, created, ok } from '../utils/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/auditService.js';

export const paymentRules = [
  body('reservation').isMongoId(),
  body('method').isIn(['cash-at-hotel', 'pay-at-reception', 'manual-bank-transfer', 'demo']),
  body('status').isIn(['unpaid', 'pending', 'paid', 'partially-refunded', 'refunded']),
  body('amount').isFloat({ min: 0 }),
  body('transactionReference').optional().isString().trim().isLength({ max: 120 }),
  body('notes').optional().isString().trim().isLength({ max: 800 }),
  body('idempotencyKey').optional().isString().trim().isLength({ min: 8, max: 120 })
];

export const createPayment = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.validated.reservation);
  if (!reservation) throw new AppError(404, 'Reservation not found.', 'RESERVATION_NOT_FOUND');
  if (req.user.role === 'guest') throw new AppError(403, 'Guests cannot record payments.', 'FORBIDDEN');
  if (req.validated.idempotencyKey) {
    const existing = await Payment.findOne({ reservation: reservation._id, idempotencyKey: req.validated.idempotencyKey });
    if (existing) return ok(res, existing, 'Payment already recorded.');
  }
  const payment = await Payment.create({ ...req.validated, recordedBy: req.user._id });
  reservation.paymentStatus = req.validated.status;
  await reservation.save();
  await audit(req, 'payment.record', 'Payment', payment._id, { reservation: reservation._id, status: payment.status });
  created(res, payment, 'Payment recorded.');
});

export const listPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.reservation) filter.reservation = req.query.reservation;
  ok(res, await Payment.find(filter).populate('reservation').populate('recordedBy', 'name email role').sort({ createdAt: -1 }).limit(200));
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('reservation').populate('recordedBy', 'name email role');
  if (!payment) throw new AppError(404, 'Payment not found.', 'PAYMENT_NOT_FOUND');
  ok(res, payment);
});

