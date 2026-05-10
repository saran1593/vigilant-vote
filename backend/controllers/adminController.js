const complaintService = require('../services/complaintService');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getAllComplaints();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminNotes } = req.body;
    const updated = await complaintService.updateComplaintStatus(complaintId, status, adminNotes, req.user._id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHeatmapData = async (req, res) => {
  try {
    const complaints = await complaintService.getAllComplaints();
    const heatmap = complaints.map(c => ({
      lat: c.location.lat,
      lng: c.location.lng,
      intensity: 1 // For simple heatmap, or scale by severity
    })).filter(h => h.lat && h.lng);
    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const manageAdmins = async (req, res) => {
  try {
    const { email, action, password } = req.body; // action: 'add' or 'remove'
    const role = action === 'add' ? 'admin' : 'user';
    
    let updateData = { role };
    if (action === 'add' && password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await User.findOneAndUpdate(
      { email },
      updateData,
      { returnDocument: 'after', upsert: action === 'add' } // Create if doesn't exist when adding
    );

    // If upserted, ensure userId is set
    if (action === 'add' && !user.userId) {
      const { v4: uuidv4 } = require('uuid');
      user.userId = uuidv4();
      await user.save();
    }
    
    res.json({ message: `User role updated to ${role}`, user: { email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('email role createdAt');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllComplaints, updateStatus, getHeatmapData, manageAdmins, getAdmins };
