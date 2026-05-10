const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/verify-password', authController.verifyPassword);

module.exports = router;
