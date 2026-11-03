const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  otpRequestLimiter, otpVerifyLimiter, loginLimiter, passwordCheckLimiter
} = require('../middleware/rateLimiter');

router.post('/request-otp', otpRequestLimiter, authController.requestOTP);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOTP);
router.post('/login', loginLimiter, authController.login);
router.post('/verify-password', protect, passwordCheckLimiter, authController.verifyPassword);

router.get('/voter-status', protect, authController.voterStatus);
router.post('/voter-id', protect, authController.linkVoterId);
router.post('/voter-id', protect, passwordCheckLimiter, authController.linkVoterId);

module.exports = router;