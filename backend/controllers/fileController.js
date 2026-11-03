const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { logAction } = require('../utils/audit');

const NAME = /^[a-f0-9]{32}\.(jpg|jpeg|png|pdf)$/;

const getFile = async (req, res) => {
  try {
    const name = path.basename(req.params.filename);
    if (!NAME.test(name)) return res.status(400).json({ message: 'Invalid file name' });

    const url = `/uploads/${name}`;
    const complaint = await Complaint.findOne({
      $or: [{ evidenceUrl: url }, { 'fieldReport.photoUrl': url }]
    });
    if (!complaint) return res.status(404).json({ message: 'File not found' });

    const { role, userId } = req.user;
    if (role === 'user') {
      if (complaint.voterId !== userId || complaint.evidenceUrl !== url) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    } else if (role === 'officer') {
      const officer = await User.findOne({ userId });
      if (!officer || !complaint.assignedOfficer || !complaint.assignedOfficer.equals(officer._id)) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    }
    // admin and superadmin are allowed

    const full = path.join(__dirname, '..', 'uploads', name);
    if (!fs.existsSync(full)) return res.status(404).json({ message: 'File missing on server' });

    if (role !== 'user') logAction(req, 'VIEW_FILE', complaint.complaintId, name);
    res.sendFile(full);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFile };