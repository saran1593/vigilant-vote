const AuditLog = require('../models/AuditLog');

// Never lets a logging failure break the real action
const logAction = async (req, action, complaintId = null, details = '') => {
  try {
    await AuditLog.create({
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action,
      complaintId,
      details,
      ip: req.ip
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { logAction };