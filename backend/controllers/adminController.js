const complaintService = require('../services/complaintService');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../utils/audit');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getAllComplaints();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).select('email district');
    res.json(officers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { officerId } = req.body;
    if (!officerId) return res.status(400).json({ message: 'Officer is required' });
    const admin = await User.findOne({ userId: req.user.userId });
    const updated = await complaintService.assignComplaint(complaintId, officerId, admin._id);
    logAction(req, 'ASSIGN', complaintId, `Assigned to ${updated.assignedOfficer?.email}`);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const giveVerdict = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { result, note } = req.body;
    if (!['genuine', 'false'].includes(result)) {
      return res.status(400).json({ message: 'Verdict must be genuine or false' });
    }
    const admin = await User.findOne({ userId: req.user.userId });
    const updated = await complaintService.giveVerdict(complaintId, result, note, admin._id);
    logAction(req, 'VERDICT', complaintId, `Verdict: ${result}`);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Called by the frontend after the password re-check succeeds
const logView = async (req, res) => {
  const { action } = req.body;
  if (!['DECRYPT', 'VIEW_EVIDENCE'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }
  await logAction(req, action, req.params.complaintId);
  res.json({ logged: true });
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
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
      intensity: 1
    })).filter(h => h.lat && h.lng);
    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const manageAdmins = async (req, res) => {
  try {
    const { email, action, password, role, district } = req.body;
    if (!email || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Email and a valid action are required' });
    }

    const targetRole = role === 'officer' ? 'officer' : 'admin';

    const existing = await User.findOne({ email });
    if (existing && existing.role === 'superadmin') {
      return res.status(403).json({ message: 'Superadmin cannot be modified' });
    }

    if (action === 'add') {
      if (!password) return res.status(400).json({ message: 'Password is required' });
      if (targetRole === 'officer' && !district) {
        return res.status(400).json({ message: 'District is required for officers' });
      }
      const user = existing || new User({ userId: uuidv4(), email, isVerified: true });
      user.role = targetRole;
      if (targetRole === 'officer') user.district = district;
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      logAction(req, 'STAFF_ADDED', null, `${email} as ${targetRole}`);
      return res.json({
        message: `User role updated to ${targetRole}`,
        user: { email: user.email, role: user.role }
      });
    }

    if (!existing) return res.status(404).json({ message: 'User not found' });
    existing.role = 'user';
    await existing.save();
    logAction(req, 'STAFF_REVOKED', null, email);
    res.json({ message: 'Access revoked', user: { email: existing.email, role: existing.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdmins = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'officer'] } })
      .select('email role district createdAt');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Superadmin only: reveal the reporter of a complaint proven false
const revealIdentity = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { reason, password } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: 'Please give a reason (at least 10 characters)' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const actor = await User.findOne({ userId: req.user.userId });
    const ok = actor && actor.password && (await bcrypt.compare(password, actor.password));
    if (!ok) {
      await logAction(req, 'IDENTITY_REVEAL_DENIED', complaintId, 'Wrong password');
      return res.status(401).json({ message: 'Invalid password' });
    }

    const Complaint = require('../models/Complaint');
    const complaint = await Complaint.findOne({ complaintId });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (!complaint.verdict || complaint.verdict.result !== 'false') {
      await logAction(req, 'IDENTITY_REVEAL_DENIED', complaintId, 'Verdict is not false');
      return res.status(403).json({
        message: 'Identity can be revealed only for complaints with a False Report verdict'
      });
    }

    const voter = await User.findOne({ userId: complaint.voterId });
    if (!voter) {
      return res.status(404).json({ message: 'Reporter account not found (demo or deleted account)' });
    }

    await logAction(req, 'IDENTITY_REVEAL', complaintId, `Reason: ${reason.trim()}`);

    res.json({
      email: voter.email,
      voterIdLast4: voter.voterIdLast4 || null,
      registeredDistrict: voter.voterDistrict || null,
      registeredBooth: voter.voterBooth || null,
      falseReports: voter.falseReports,
      isBlocked: voter.isBlocked
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getStats = async (req, res) => {
  try {
    const Complaint = require('../models/Complaint');
    const [byStatus, byCategory, byDistrict, verdicts, total, last7, resolution] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $group: { _id: '$location.district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      Complaint.aggregate([{ $match: { 'verdict.result': { $exists: true } } }, { $group: { _id: '$verdict.result', count: { $sum: 1 } } }]),
      Complaint.countDocuments(),
      Complaint.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Complaint.aggregate([
        { $match: { 'verdict.decidedAt': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: { $subtract: ['$verdict.decidedAt', '$createdAt'] } } } }
      ])
    ]);
    res.json({
      total,
      last7,
      byStatus,
      byCategory,
      byDistrict,
      verdicts,
      avgResolutionHours: resolution[0] ? +(resolution[0].avg / 3600000).toFixed(1) : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  getAllComplaints, getOfficers, assignComplaint, giveVerdict,
  logView, getAuditLogs, getHeatmapData, manageAdmins, getAdmins,
  revealIdentity, getStats
};