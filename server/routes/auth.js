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
