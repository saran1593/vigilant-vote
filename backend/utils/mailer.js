const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST.replace(/"/g, ''),
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_MAIL.replace(/"/g, ''),
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendOTP = async (email, otp) => {
  const fromEmail = process.env.SMTP_MAIL.replace(/"/g, '');
  const mailOptions = {
    from: `"Vigilant Vote" <${fromEmail}>`,
    to: email,
    subject: 'Your Login OTP - Vigilant Vote',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1e40af; text-align: center;">Vigilant Vote</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for secure login is:</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #1e40af; border-radius: 5px;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Secure Reporting for Election Integrity</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendMail = async ({ to_address, subject, body, attachments = [] }) => {
  const fromEmail = process.env.SMTP_MAIL.replace(/"/g, '');
  const mailOptions = {
    from: fromEmail,
    to: to_address,
    subject: subject,
    text: body.replace(/<[^>]*>?/gm, ''),
    html: body,
    attachments: attachments,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendMail };
