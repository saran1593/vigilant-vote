const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  voterId: { type: String, required: true },
  category: { type: String, required: true },
  encryptedContent: { type: String, required: true },
  checksum: { type: String, required: true }, // Digital Tamper Seal
  evidenceUrl: { type: String },
  status: { type: String, enum: ['pending', 'investigating', 'resolved'], default: 'pending' },
  location: {
    district: { type: String, required: true },
    boothNumber: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  adminNotes: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
