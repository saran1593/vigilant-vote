const complaintService = require('../services/complaintService');
const { resolveCoordinates } = require('../utils/districts');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 },
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
      if (!category || !encryptedContent || !location) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const rawLocation = typeof location === 'string' ? JSON.parse(location) : location;
      const coords = resolveCoordinates(rawLocation.district, rawLocation.boothNumber);
      if (!coords) {
        return res.status(400).json({ message: 'Please select a valid district' });
      }
      const parsedLocation = {
        district: coords.district,
        boothNumber: String(rawLocation.boothNumber).trim(),
        lat: coords.lat,
        lng: coords.lng
      };

      let evidenceUrl = null;

      if (req.file) {
        const originalPath = req.file.path;
        const extension = path.extname(req.file.originalname).toLowerCase();

        // Strip metadata (EXIF/GPS) by re-encoding images
        if (['.png', '.jpg', '.jpeg'].includes(extension)) {
          const tempPath = originalPath + '_temp';
          if (extension === '.png') {
            await sharp(originalPath).png().toFile(tempPath);
          } else {
            await sharp(originalPath).jpeg({ quality: 90 }).toFile(tempPath);
          }
          fs.unlinkSync(originalPath);
          fs.renameSync(tempPath, originalPath);
        }

        evidenceUrl = `/uploads/${req.file.filename}`;
      }

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