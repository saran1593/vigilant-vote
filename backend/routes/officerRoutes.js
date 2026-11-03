const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const officerController = require('../controllers/officerController');

router.use(protect);
router.use(authorize('officer'));

router.get('/assignments', officerController.getMyAssignments);
router.post('/assignments/:complaintId/report', officerController.submitReport);
router.post('/assignments/:complaintId/log', officerController.logDecrypt);

module.exports = router;