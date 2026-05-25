import { Schema, model } from 'mongoose';

const otpSchema = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    type: { type: String, required: true, enum: ['register', 'reset_password'] },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Optional: Automatically delete expired OTP documents using a TTL index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model('Otp', otpSchema);
