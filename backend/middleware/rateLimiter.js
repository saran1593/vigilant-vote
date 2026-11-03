const rateLimit = require('express-rate-limit');

const make = (max, minutes, message) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
  });

module.exports = {
  otpRequestLimiter: make(5, 15, 'Too many OTP requests. Please try again in 15 minutes.'),
  otpVerifyLimiter: make(10, 15, 'Too many attempts. Please try again in 15 minutes.'),
  loginLimiter: make(10, 15, 'Too many login attempts. Please try again in 15 minutes.'),
  passwordCheckLimiter: make(10, 15, 'Too many attempts. Please try again in 15 minutes.')
};