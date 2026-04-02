const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const redis = require('../config/redis');
const User = require('../models/User');

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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + OTP_EXPIRY * 1000);

    // Try to store OTP in Redis; fall back to database if Redis is unavailable
    let redisStored = false;
    try {
      await Promise.race([
        redis.set(`otp:email:${userId}`, otp, { ex: OTP_EXPIRY }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 5000)
        )
      ]);
      redisStored = true;
    } catch (redisErr) {
      console.error('⚠️ Redis error, falling back to database for OTP storage:', redisErr.message);
    }

    if (!redisStored) {
      try {
        await User.findByIdAndUpdate(userId, { emailOtp: otp, emailOtpExpiry: expiry });
      } catch (dbErr) {
        console.error('❌ Database OTP storage failed:', dbErr.message);
        throw new Error('Failed to store OTP. Please try again later.');
      }
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
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    const key = `otp:${type}:${userId}`;
    let stored = null;
    let fromDatabase = false;

    // Try Redis first
    try {
      stored = await Promise.race([
        redis.get(key),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 5000)
        )
      ]);
    } catch (redisErr) {
      console.error('⚠️ Redis error during verification, checking database fallback:', redisErr.message);
    }

    // If not found in Redis, check the database fallback (email OTP only)
    if (!stored && type === 'email') {
      try {
        const user = await User.findById(userId).select('+emailOtp +emailOtpExpiry');
        if (user && user.emailOtp) {
          if (user.emailOtpExpiry && user.emailOtpExpiry < new Date()) {
            await User.findByIdAndUpdate(userId, { emailOtp: null, emailOtpExpiry: null });
            throw new Error('OTP expired or not found');
          }
          stored = user.emailOtp;
          fromDatabase = true;
        }
      } catch (dbErr) {
        if (dbErr.message === 'OTP expired or not found') throw dbErr;
        console.error('⚠️ Database OTP lookup failed:', dbErr.message);
      }
    }

    if (!stored) throw new Error('OTP expired or not found');
    if (stored.toString().trim() !== otp.toString().trim()) throw new Error('Invalid OTP');

    // Delete OTP after successful verification
    if (fromDatabase) {
      await User.findByIdAndUpdate(userId, { emailOtp: null, emailOtpExpiry: null });
    } else {
      await redis.del(key);
    }
    return true;
  } catch (error) {
    console.error('❌ verifyOtp error:', error.message);
    throw error;
  }
};

module.exports = { sendEmailOtp, verifyOtp };
