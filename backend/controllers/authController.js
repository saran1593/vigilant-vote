const authService = require('../services/authService');

const requestOTP = async (req, res) => {
  try {
    const { email, fingerprint } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const result = await authService.requestOTP(email, fingerprint);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp, fingerprint } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const result = await authService.verifyOTP(email, otp, fingerprint);
    if (result.success) {
      res.status(200).json({ message: 'Login successful', token: result.token, user: result.user });
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginWithPassword(email, password);
    if (result.success) {
      res.status(200).json({ message: 'Login successful', token: result.token, user: result.user });
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Uses the logged-in user's email from the token, not from the request body
const verifyPassword = async (req, res) => {
  try {
    const result = await authService.verifyPassword(req.user.email, req.body.password);
    res.status(result.success ? 200 : 401).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const voterStatus = async (req, res) => {
  try {
    res.json(await authService.getVoterStatus(req.user.userId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const linkVoterId = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only voters can link a voter ID' });
    }
        const result = await authService.linkVoterId(req.user.userId, req.body.epic, req.body.name);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestOTP, verifyOTP, login, verifyPassword, voterStatus, linkVoterId };