const complaintService = require('../services/complaintService');
const User = require('../models/User');
const { logAction } = require('../utils/audit');
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
    const types = /jpeg|jpg|png/;
    const okExt = types.test(path.extname(file.originalname).toLowerCase());
    const okMime = types.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error('Only JPG or PNG photos are allowed'));
  }
}).single('photo');

// Re-encode the image so EXIF/GPS/device metadata is dropped.
// sharp removes metadata by default unless withMetadata() is called.
const stripMetadata = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = filePath + '_clean';
  const img = sharp(filePath);
  if (ext === '.png') {
    await img.png().toFile(tempPath);
  } else {
    await img.jpeg({ quality: 90 }).toFile(tempPath);
  }
  fs.unlinkSync(filePath);
  fs.renameSync(tempPath, filePath);
};

const getMyAssignments = async (req, res) => {
  try {
    const officer = await User.findOne({ userId: req.user.userId });
    const complaints = await complaintService.getOfficerAssignments(officer._id);
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitReport = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const { notes } = req.body;
      if (!notes || !notes.trim()) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: 'Field report notes are required' });
      }

      if (req.file) {
        try {
          await stripMetadata(req.file.path);
        } catch (e) {
          fs.unlink(req.file.path, () => {});
          return res.status(400).json({ message: 'Invalid image file' });
        }
      }

      const officer = await User.findOne({ userId: req.user.userId });
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const updated = await complaintService.submitFieldReport(
        req.params.complaintId, officer._id, notes.trim(), photoUrl
      );
      logAction(
        req,
        'FIELD_REPORT',
        req.params.complaintId,
        photoUrl ? 'With photo (metadata removed)' : 'No photo'
      );
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
};

const logDecrypt = async (req, res) => {
  await logAction(req, 'DECRYPT', req.params.complaintId);
  res.json({ logged: true });
};

module.exports = { getMyAssignments, submitReport, logDecrypt };