const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Agent = require('../models/Agent');
const { protect } = require('../middleware/authMiddleware');
const { sendEmailOtp, verifyOtp } = require('../services/otpService');

const router = express.Router();

// Rate limiters for sensitive auth endpoints
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many OTP attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

    // Send OTP with error handling
    try {
      await sendEmailOtp(user._id, email);
    } catch (otpErr) {
      console.error('❌ OTP send failed:', otpErr.message);
      // Delete the user since OTP couldn't be sent
      await User.findByIdAndDelete(user._id);
      return res.status(503).json({
        message: 'Failed to send OTP. Please check your email configuration or try again later.',
        error: otpErr.message
      });
    }

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      userId: user._id
    });

  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({
      message: error.message || 'Server error during registration',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
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

    try {
      await sendEmailOtp(user._id, user.email);
    } catch (otpErr) {
      console.error('❌ Resend OTP failed:', otpErr.message);
      return res.status(503).json({
        message: 'Failed to resend OTP. Please check your email configuration or try again later.',
        error: otpErr.message
      });
    }
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
      try {
        await sendEmailOtp(user._id, user.email);
      } catch (otpErr) {
        console.error('❌ OTP send failed during login:', otpErr.message);
        return res.status(503).json({
          message: 'Failed to send verification OTP. Please check your email configuration or try again later.',
          error: otpErr.message
        });
      }
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        userId: user._id,
        needsVerification: true
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });

  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── Admin Login (Step 1) - validates credentials then sends OTP ─────
router.post('/admin/login', adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Send OTP for 2-step verification
    try {
      await sendEmailOtp(user._id, user.email);
    } catch (otpErr) {
      console.error('❌ Admin OTP send failed:', otpErr.message);
      return res.status(503).json({
        message: 'Failed to send OTP. Please check your email configuration or try again later.',
        error: otpErr.message
      });
    }

    res.json({
      message: 'OTP sent to your email for verification.',
      userId: user._id,
      requiresOtp: true
    });

  } catch (error) {
    console.error('❌ Admin login error:', error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── Admin Verify OTP (Step 2) - verifies OTP and returns JWT ────────
router.post('/admin/verify-otp', adminOtpLimiter, async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    await verifyOtp(userId, otp, 'email');

    // Mark email verified if not already
    if (!user.emailVerified) {
      await User.findByIdAndUpdate(userId, { emailVerified: true });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Admin login successful ✅',
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

// ─── Me ──────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
