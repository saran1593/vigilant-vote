const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_MAIL, pass: process.env.SMTP_PASSWORD }
});

const sendMail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"VigilantVote" <${process.env.SMTP_MAIL}>`,
      to,
      subject,
      text
    });
  } catch (err) {
    // An email failure must never break the complaint workflow
    console.error('Notification email failed:', err.message);
  }
};

// type: 'assigned' | 'reviewing' | 'genuine' | 'false'
const notifyVoter = async (voterId, type, complaintId, extra = {}) => {
  try {
    const voter = await User.findOne({ userId: voterId });
    if (!voter || !voter.email) return; // e.g. seeded demo complaints

    const ref = complaintId.slice(0, 8).toUpperCase();

    if (type === 'assigned') {
      return sendMail(
        voter.email,
        `Complaint ${ref}: investigation started`,
        `Your complaint (ref ${ref}) has been assigned to a field officer and is now being investigated.\n\nYou can track the status in your VigilantVote dashboard.`
      );
    }

    if (type === 'reviewing') {
      return sendMail(
        voter.email,
        `Complaint ${ref}: field report received`,
        `The field officer has visited the site and submitted a report for your complaint (ref ${ref}). It is now under final review by the administrator.`
      );
    }

    if (type === 'genuine') {
      return sendMail(
        voter.email,
        `Complaint ${ref}: verified and resolved`,
        `Your complaint (ref ${ref}) was verified by our field officer and has been resolved.\n\nThank you for helping protect election integrity.`
      );
    }

    if (type === 'false') {
      let text = `Your complaint (ref ${ref}) could not be verified after a field investigation and was marked as a false report.\n\nFalse reports are recorded against the account. You currently have ${extra.falseReports} of 3 allowed strikes.`;
      if (extra.blocked) {
        text += `\n\nYour account has now been blocked from filing new complaints.`;
      }
      return sendMail(voter.email, `Complaint ${ref}: could not be verified`, text);
    }
  } catch (err) {
    console.error('notifyVoter error:', err.message);
  }
};

module.exports = { notifyVoter };