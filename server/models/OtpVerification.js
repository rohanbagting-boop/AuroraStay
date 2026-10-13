import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    registrationData: {
      name: { type: String, required: true, trim: true },
      password: { type: String, required: true },
      phone: { type: String, trim: true }
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    resendCooldownUntil: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 1000)
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

export const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);
