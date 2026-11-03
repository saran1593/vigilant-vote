const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  voterId: { type: String, required: true },
  category: { type: String, required: true },
  encryptedContent: { type: String, required: true },
  checksum: { type: String, required: true },
  evidenceUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'reviewing', 'resolved', 'rejected'],
    default: 'pending'
  },
  location: {
    district: { type: String, required: true },
    boothNumber: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  adminNotes: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fieldReport: {
    notes: { type: String },
    photoUrl: { type: String },
    submittedAt: { type: Date }
  },
  verdict: {
    result: { type: String, enum: ['genuine', 'false'] },
    note: { type: String },
    decidedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);