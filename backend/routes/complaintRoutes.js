const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const complaintController = require('../controllers/complaintController');

router.post('/', protect, complaintController.createComplaint);
router.get('/my', protect, complaintController.getMyComplaints);

module.exports = router;
