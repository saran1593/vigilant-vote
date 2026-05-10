const User = require('../models/User');
const { sendOTP } = require('../utils/mailer');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const requestOTP = async (email, fingerprint) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      userId: uuidv4(),
      email,
      role: 'user'
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  user.browserFingerprint = fingerprint || null; // Optional binding
  await user.save();

  try {
    await sendOTP(email, otp);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

const verifyOTP = async (email, otp, currentFingerprint) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, message: 'User not found' };

  if (user.otp !== otp) return { success: false, message: 'Invalid OTP' };
  if (user.otpExpiry < new Date()) return { success: false, message: 'OTP expired' };

  // Check fingerprint if it was bound during request
  if (user.browserFingerprint && user.browserFingerprint !== currentFingerprint) {
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return { success: false, message: 'Security violation: OTP bound to different device' };
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  const token = jwt.sign(
    { userId: user.userId, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { success: true, token, user: { userId: user.userId, email: user.email, role: user.role } };
};

const bcrypt = require('bcrypt');

const loginWithPassword = async (email, password) => {
  // Hardcoded Superadmin Check (as fallback/seed/update)
  if (email === 'superadmin@vigilant.com' && password === 'superadmin@321') {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        userId: uuidv4(),
        email,
        role: 'superadmin',
        isVerified: true,
        password: await bcrypt.hash(password, 10)
      });
      await user.save();
    } else if (!user.password) {
      // Update existing user if password is missing
      user.password = await bcrypt.hash(password, 10);
      user.role = 'superadmin';
      await user.save();
    }
  }

  const user = await User.findOne({ email });
  if (!user) return { success: false, message: 'User not found' };
  
  if (!['admin', 'superadmin'].includes(user.role)) {
    return { success: false, message: 'Only administrators can login with a password' };
  }

  if (!user.password) {
    return { success: false, message: 'No password set for this account. Contact superadmin.' };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, message: 'Invalid credentials' };
    
  const token = jwt.sign(
    { userId: user.userId, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  return { success: true, token, user: { userId: user.userId, email: user.email, role: user.role } };
};

const verifyPassword = async (email, password) => {
  // Hardcoded fallback for Superadmin verification
  if (email === 'superadmin@vigilant.com' && password === 'superadmin@321') {
    return { success: true, message: 'Password verified' };
  }

  const user = await User.findOne({ email });
  if (!user || !user.password) return { success: false, message: 'User not found or no password set' };

  const isMatch = await bcrypt.compare(password, user.password);
  return { success: isMatch, message: isMatch ? 'Password verified' : 'Invalid password' };
};

module.exports = { requestOTP, verifyOTP, loginWithPassword, verifyPassword };
