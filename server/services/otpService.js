const crypto = require('crypto');
const nodemailer = require('nodemailer');
const redis = require('../config/redis');

const OTP_EXPIRY = 600;
const EMAIL_TIMEOUT = 30000; // 30 second timeout
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second base delay for exponential backoff

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  socketTimeout: 30000,
  connectionTimeout: 30000
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendEmailWithRetry = async (mailOptions, attempt = 1) => {
  try {
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout - 30 seconds exceeded')), EMAIL_TIMEOUT)
      )
    ]);
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Email attempt ${attempt} failed (${err.message}). Retrying in ${delay}ms...`);
      await sleep(delay);
      return sendEmailWithRetry(mailOptions, attempt + 1);
    }
    throw err;
  }
};

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

    // Send email with retry logic
    await sendEmailWithRetry({
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
    });

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
    if (stored.toString() !== otp.toString()) throw new Error('Invalid OTP');

    await redis.del(key);
    return true;
  } catch (error) {
    console.error('❌ verifyOtp error:', error.message);
    throw error;
  }
};

module.exports = { sendEmailOtp, verifyOtp };
