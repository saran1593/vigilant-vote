const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

router.get('/:filename', protect, fileController.getFile);

module.exports = router;