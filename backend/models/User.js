const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'officer', 'admin', 'superadmin'], default: 'user' },
  district: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  browserFingerprint: { type: String },
  password: { type: String },
  falseReports: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  voterIdHash: { type: String, unique: true, sparse: true },
  voterIdLast4: { type: String },
  voterDistrict: { type: String },
  voterBooth: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);