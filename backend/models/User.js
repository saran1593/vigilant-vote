const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  browserFingerprint: { type: String }, 
  password: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
