import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 1200 },
    baseRate: { type: Number, required: true, min: 0 },
    amenities: [{ type: String, trim: true, maxlength: 80 }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const RoomType = mongoose.model('RoomType', schema);

