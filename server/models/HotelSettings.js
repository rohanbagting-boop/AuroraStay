import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'hotel-settings', unique: true },
    hotelName: { type: String, default: 'Aurora Stay Hotel' },
    address: { type: String, default: 'Makati City, Philippines' },
    contactEmail: { type: String, default: 'hello@aurorastay.test' },
    contactPhone: { type: String, default: '+63 2 5555 0100' },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    taxRate: { type: Number, default: 0.12 },
    serviceFeeRate: { type: Number, default: 0.05 },
    cancellationHours: { type: Number, default: 24 }
  },
  { timestamps: true }
);

export const HotelSettings = mongoose.model('HotelSettings', schema);

