const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');


router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/complaints', adminController.getAllComplaints);
router.patch('/complaints/:complaintId', adminController.updateStatus);
router.get('/heatmap', adminController.getHeatmapData);


router.get('/admins', authorize('superadmin'), adminController.getAdmins);
router.post('/manage-admins', authorize('superadmin'), adminController.manageAdmins);

module.exports = router;
