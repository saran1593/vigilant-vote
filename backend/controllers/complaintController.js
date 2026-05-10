const complaintService = require('../services/complaintService');
const multer = require('multer');
const path = require('path');

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images and PDFs are allowed'));
  }
}).single('evidence');

const createComplaint = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const { category, encryptedContent, location } = req.body;
      const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
      
      const evidenceUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const complaint = await complaintService.createComplaint({
        category,
        encryptedContent,
        location: parsedLocation,
        evidenceUrl
      }, req.user.userId);

      res.status(201).json(complaint);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getComplaintsForUser(req.user.userId);
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createComplaint, getMyComplaints };
