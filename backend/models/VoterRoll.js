const mongoose = require('mongoose');

const voterRollSchema = new mongoose.Schema({
  epic: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  district: { type: String, required: true },
  boothNumber: { type: String, required: true }
});

module.exports = mongoose.model('VoterRoll', voterRollSchema);