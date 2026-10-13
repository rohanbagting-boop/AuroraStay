import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['cash-at-hotel', 'pay-at-reception', 'manual-bank-transfer', 'demo'], required: true },
    status: { type: String, enum: ['unpaid', 'pending', 'paid', 'partially-refunded', 'refunded'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PHP' },
    transactionReference: { type: String, trim: true },
    notes: { type: String, maxlength: 800 },
    idempotencyKey: { type: String, index: true, sparse: true }
  },
  { timestamps: true }
);

paymentSchema.index({ reservation: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model('Payment', paymentSchema);

