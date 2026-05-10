const Complaint = require('../models/Complaint');
const { generateChecksum, verifyChecksum } = require('../utils/checksum');
const { v4: uuidv4 } = require('uuid');

const createComplaint = async (data, voterId) => {
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
  const complaints = await Complaint.find(filters).populate('assignedTo', 'email').sort({ createdAt: -1 });
  
  
  return complaints.map(c => {
    const isCompromised = !verifyChecksum(c.encryptedContent, c.checksum);
    return { ...c.toObject(), isCompromised };
  });
};

const updateComplaintStatus = async (complaintId, status, notes, adminId) => {
  return Complaint.findOneAndUpdate(
    { complaintId },
    { status, adminNotes: notes, assignedTo: adminId },
    { new: true }
  );
};

module.exports = { createComplaint, getComplaintsForUser, getAllComplaints, updateComplaintStatus };
