const crypto = require('crypto');
const nodemailer = require('nodemailer');
const redis = require('../config/redis');

const OTP_EXPIRY = 600;
const EMAIL_TIMEOUT = 15000; // 15 second timeout

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  socketTimeout: 10000,
  connectionTimeout: 10000
});

const sendEmailOtp = async (userId, email) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('❌ EMAIL_USER or EMAIL_PASS not configured. Configure in Vercel environment variables.');
    }

    const otp = generateOTP();
    
    // Store OTP in Redis with timeout
    try {
      await Promise.race([
        redis.set(`otp:email:${userId}`, otp, { ex: OTP_EXPIRY }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis timeout')), 5000)
        )
      ]);
    } catch (redisErr) {
      console.error('⚠️ Redis error (continuing with email):', redisErr.message);
    }

    // Send email with timeout
    await Promise.race([
      transporter.sendMail({
        from: `"Order Tracking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification OTP',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:auto">
            <h2>Verify your email</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing:8px;color:#4F46E5">${otp}</h1>
            <p>Valid for 10 minutes. Do not share this with anyone.</p>
          </div>
        `
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout - 15 seconds exceeded')), EMAIL_TIMEOUT)
      )
    ]);

    console.log(`✅ Email OTP sent to ${email}`);
    return true;

  } catch (error) {
    console.error('❌ sendEmailOtp error:', error.message);
    throw error;
  }
};

const verifyOtp = async (userId, otp, type) => {
  try {
    const key = `otp:${type}:${userId}`;
    const stored = await Promise.race([
      redis.get(key),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 5000)
      )
    ]);

    if (!stored) throw new Error('OTP expired or not found');
    if (stored !== otp) throw new Error('Invalid OTP');

    await redis.del(key);
    return true;
  } catch (error) {
    console.error('❌ verifyOtp error:', error.message);
    throw error;
  }
};

module.exports = { sendEmailOtp, verifyOtp };
