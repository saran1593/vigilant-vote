const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const { passwordCheckLimiter } = require('../middleware/rateLimiter');
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/complaints', adminController.getAllComplaints);
router.patch('/complaints/:complaintId/assign', adminController.assignComplaint);
router.patch('/complaints/:complaintId/verdict', adminController.giveVerdict);
router.post('/complaints/:complaintId/log', adminController.logView);
router.get('/officers', adminController.getOfficers);
router.get('/heatmap', adminController.getHeatmapData);

router.get('/admins', authorize('superadmin'), adminController.getAdmins);
router.post('/manage-admins', authorize('superadmin'), adminController.manageAdmins);
router.get('/audit-logs', authorize('superadmin'), adminController.getAuditLogs);
router.post('/complaints/:complaintId/reveal-identity', authorize('superadmin'), passwordCheckLimiter, adminController.revealIdentity);
router.get('/stats', adminController.getStats);
module.exports = router;