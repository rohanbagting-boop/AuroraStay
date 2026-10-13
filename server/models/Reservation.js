import mongoose from 'mongoose';

const moneySchema = new mongoose.Schema(
  {
    nightlyRate: Number,
    nights: Number,
    subtotal: Number,
    tax: Number,
    serviceFee: Number,
    total: Number,
    currency: { type: String, default: 'PHP' }
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true, index: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    guests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'],
      default: 'confirmed',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'partially-refunded', 'refunded'],
      default: 'unpaid',
      index: true
    },
    guestInfo: {
      name: String,
      email: String,
      phone: String
    },
    specialRequests: { type: String, trim: true, maxlength: 1000 },
    cancellationReason: String,
    cancelledAt: Date,
    checkedInAt: Date,
    checkedOutAt: Date,
    price: moneySchema,
    roomSnapshot: {
      roomNumber: String,
      name: String,
      roomTypeName: String,
      capacity: Number,
      bedType: String
    },
    idempotencyKey: { type: String, index: true, sparse: true }
  },
  { timestamps: true }
);

reservationSchema.index({ room: 1, checkIn: 1, checkOut: 1, status: 1 });
reservationSchema.index({ guest: 1, createdAt: -1 });
reservationSchema.index({ idempotencyKey: 1, guest: 1 }, { unique: true, sparse: true });

export const Reservation = mongoose.model('Reservation', reservationSchema);

