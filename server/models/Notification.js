import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: Date,
    relatedReservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', schema);

