const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { generateChecksum, verifyChecksum } = require('../utils/checksum');
const { v4: uuidv4 } = require('uuid');
const { notifyVoter } = require('../utils/notifier');

const populateFields = [
  { path: 'assignedTo', select: 'email' },
  { path: 'assignedOfficer', select: 'email district' }
];

const boothDigits = (s) => String(s || '').replace(/\D/g, '');

const createComplaint = async (data, voterId) => {
  const voter = await User.findOne({ userId: voterId });
  if (voter && voter.isBlocked) {
    throw new Error('Your account is blocked due to repeated false reports');
  }
  if (voter && !voter.voterIdHash) {
    throw new Error('Please verify your voter ID before filing a complaint');
  }
  if (voter) {
    const sameDistrict =
      String(voter.voterDistrict || '').toLowerCase() ===
      String(data.location.district || '').toLowerCase();
    const sameBooth =
      boothDigits(voter.voterBooth) === boothDigits(data.location.boothNumber);
    if (!sameDistrict || !sameBooth) {
      throw new Error(
        `You can only file complaints for your registered booth (${voter.voterDistrict}, booth ${voter.voterBooth})`
      );
    }
  }

  const { category, encryptedContent, location, evidenceUrl } = data;
  const checksum = generateChecksum(encryptedContent);

  const complaint = new Complaint({
    complaintId: uuidv4(),
    voterId,
    category,
    encryptedContent,
    checksum,
    location,
    evidenceUrl,
    status: 'pending'
  });

  await complaint.save();
  return complaint;
};

const getComplaintsForUser = async (voterId) => {
  return Complaint.find({ voterId }).sort({ createdAt: -1 });
};

const getAllComplaints = async (filters = {}) => {
  const complaints = await Complaint.find(filters)
    .populate(populateFields)
    .sort({ createdAt: -1 });

  return complaints.map(c => {
    const isCompromised = !verifyChecksum(c.encryptedContent, c.checksum);
    return { ...c.toObject(), isCompromised };
  });
};

const updateComplaintStatus = async (complaintId, status, notes, adminId) => {
  const update = { assignedTo: adminId };
  if (status) update.status = status;
  if (notes !== undefined) update.adminNotes = notes;
  return Complaint.findOneAndUpdate({ complaintId }, update, { new: true, runValidators: true });
};

// Admin assigns a complaint to a field officer
const assignComplaint = async (complaintId, officerId, adminId) => {
  if (!mongoose.isValidObjectId(officerId)) throw new Error('Invalid officer');
  const officer = await User.findOne({ _id: officerId, role: 'officer' });
  if (!officer) throw new Error('Officer not found');

  const complaint = await Complaint.findOne({ complaintId });
  if (!complaint) throw new Error('Complaint not found');
  if (['resolved', 'rejected'].includes(complaint.status)) {
    throw new Error('This complaint is already closed');
  }

  complaint.assignedOfficer = officer._id;
  complaint.assignedTo = adminId;
  complaint.status = 'investigating';
  await complaint.save();

  notifyVoter(complaint.voterId, 'assigned', complaint.complaintId);

  return Complaint.findById(complaint._id).populate(populateFields);
};

// Officer: list own assignments (voter identity is hidden)
const getOfficerAssignments = async (officerId) => {
  return Complaint.find({ assignedOfficer: officerId })
    .select('-voterId')
    .sort({ updatedAt: -1 });
};

// Officer submits the field report
const submitFieldReport = async (complaintId, officerId, notes, photoUrl) => {
  const complaint = await Complaint.findOne({ complaintId, assignedOfficer: officerId });
  if (!complaint) throw new Error('This complaint is not assigned to you');
  if (['resolved', 'rejected'].includes(complaint.status)) {
    throw new Error('This complaint is already closed');
  }

  complaint.fieldReport = { notes, photoUrl: photoUrl || undefined, submittedAt: new Date() };
  complaint.status = 'reviewing';
  await complaint.save();

  notifyVoter(complaint.voterId, 'reviewing', complaint.complaintId);

  return complaint;
};

// Admin gives the final verdict
const giveVerdict = async (complaintId, result, note, adminId) => {
  const complaint = await Complaint.findOne({ complaintId });
  if (!complaint) throw new Error('Complaint not found');
  if (complaint.verdict && complaint.verdict.result) {
    throw new Error('A verdict has already been given');
  }

  complaint.verdict = { result, note, decidedAt: new Date() };
  complaint.status = result === 'genuine' ? 'resolved' : 'rejected';
  complaint.assignedTo = adminId;
  await complaint.save();

  if (result === 'false') {
    // Strike system: 3 false reports blocks the voter
    const voter = await User.findOneAndUpdate(
      { userId: complaint.voterId },
      { $inc: { falseReports: 1 } },
      { new: true }
    );
    if (voter && voter.falseReports >= 3 && !voter.isBlocked) {
      voter.isBlocked = true;
      await voter.save();
    }
    notifyVoter(complaint.voterId, 'false', complaint.complaintId, {
      falseReports: voter ? voter.falseReports : 0,
      blocked: voter ? voter.isBlocked : false
    });
  } else {
    notifyVoter(complaint.voterId, 'genuine', complaint.complaintId);
  }

  return Complaint.findById(complaint._id).populate(populateFields);
};

module.exports = {
  createComplaint,
  getComplaintsForUser,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaint,
  getOfficerAssignments,
  submitFieldReport,
  giveVerdict
};