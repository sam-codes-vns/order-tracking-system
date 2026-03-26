const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');
const { protect } = require('../middleware/authMiddleware');
const { sendEmailOtp, verifyOtp } = require('../services/otpService');

const router = express.Router();

// ─── Register ────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name, email, password, phone,
      role: role || 'customer',
      emailVerified: false
    });

    if (user.role === 'agent') {
      try {
        await Agent.create({ name: user.name, phone: phone || 'N/A', userId: user._id });
      } catch (agentErr) {
        console.error('❌ Agent creation failed:', agentErr.message);
      }
    }

    await sendEmailOtp(user._id, email);

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      userId: user._id
    });

  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── Verify Email OTP ────────────────────────────────────────────────
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

    await verifyOtp(userId, otp, 'email');
    await User.findByIdAndUpdate(userId, { emailVerified: true });

    const user = await User.findById(userId);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Registration complete ✅',
      fullyVerified: true,
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── Resend OTP ──────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await sendEmailOtp(user._id, user.email);
    res.json({ message: 'OTP resent to your email ✅' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Login ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.emailVerified) {
      await sendEmailOtp(user._id, user.email);
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        userId: user._id,
        needsVerification: true
      });
    }

    // 2-Step: send login OTP for additional verification
    await sendEmailOtp(user._id, user.email);
    return res.json({
      message: 'OTP sent to your email for login verification',
      userId: user._id,
      email: user.email,
      needsLoginOtp: true
    });

  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── Verify Login OTP ────────────────────────────────────────────────
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

    await verifyOtp(userId, otp, 'email');

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── Me ──────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;