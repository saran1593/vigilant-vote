const User = require('../models/User');
const VoterRoll = require('../models/VoterRoll');
const { sendOTP } = require('../utils/mailer');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const EPIC_REGEX = /^[A-Z]{3}[0-9]{7}$/;
const normName = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const hashEpic = (epic) =>
  crypto
    .createHmac('sha256', process.env.EPIC_HASH_KEY || process.env.JWT_SECRET)
    .update(epic)
    .digest('hex');

const requestOTP = async (email, fingerprint) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ userId: uuidv4(), email, role: 'user' });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.browserFingerprint = fingerprint || null;
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

const loginWithPassword = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, message: 'Invalid credentials' };

  if (!['admin', 'superadmin', 'officer'].includes(user.role)) {
    return { success: false, message: 'Only officials can login with a password' };
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
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    return { success: false, message: 'User not found or no password set' };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  return { success: isMatch, message: isMatch ? 'Password verified' : 'Invalid password' };
};

const getVoterStatus = async (userId) => {
  const user = await User.findOne({ userId });
  if (!user || !user.voterIdHash) return { verified: false };
  return {
    verified: true,
    last4: user.voterIdLast4 || null,
    district: user.voterDistrict || null,
    booth: user.voterBooth || null
  };
};

const linkVoterId = async (userId, rawEpic, rawName) => {
  const epic = String(rawEpic || '').trim().toUpperCase();
  if (!EPIC_REGEX.test(epic)) {
    return { success: false, message: 'Invalid voter ID format. Use 3 letters followed by 7 digits.' };
  }
  if (!String(rawName || '').trim()) {
    return { success: false, message: 'Name is required' };
  }

  const user = await User.findOne({ userId });
  if (!user) return { success: false, message: 'User not found' };
  if (user.voterIdHash) return { success: false, message: 'A voter ID is already linked to this account' };

  // Look up the electoral roll. Same message for "not found" and "name mismatch"
  // so nobody can probe which voter IDs exist.
  const record = await VoterRoll.findOne({ epic });
  if (!record || normName(record.name) !== normName(rawName)) {
    return { success: false, message: 'No matching record found in the electoral roll. Check your voter ID and name.' };
  }

  const hash = hashEpic(epic);
  const taken = await User.findOne({ voterIdHash: hash });
  if (taken) {
    return { success: false, message: 'This voter ID is already linked to another account' };
  }

  user.voterIdHash = hash;
  user.voterIdLast4 = epic.slice(-4);
  user.voterDistrict = record.district;
  user.voterBooth = record.boothNumber;
  await user.save();

  return {
    success: true,
    message: 'Voter verified against the electoral roll',
    last4: user.voterIdLast4,
    district: record.district,
    booth: record.boothNumber
  };
};

module.exports = {
  requestOTP, verifyOTP, loginWithPassword, verifyPassword, getVoterStatus, linkVoterId
};