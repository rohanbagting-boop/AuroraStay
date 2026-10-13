import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, alt: { type: String, default: 'Hotel room photo' } },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    floor: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1, max: 12 },
    bedType: { type: String, required: true, trim: true },
    sizeSqm: { type: Number, min: 1 },
    nightlyRate: { type: Number, required: true, min: 0 },
    amenities: [{ type: String, trim: true }],
    description: { type: String, required: true, trim: true, maxlength: 1600 },
    images: [imageSchema],
    status: { type: String, enum: ['available', 'occupied', 'cleaning', 'maintenance'], default: 'available', index: true },
    isArchived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

roomSchema.index({ name: 'text', description: 'text', amenities: 'text', roomNumber: 'text' });

export const Room = mongoose.model('Room', roomSchema);

