const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const redis = require('../config/redis');

const OTP_EXPIRY = 600;
const EMAIL_TIMEOUT = 15000; // 15 second timeout for SendGrid REST API
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second base delay for exponential backoff

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendEmailWithRetry = async (mailOptions, attempt = 1) => {
  try {
    await Promise.race([
      sgMail.send({
        to: mailOptions.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: 'Order Tracking'
        },
        subject: mailOptions.subject,
        html: mailOptions.html
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout - 15 seconds exceeded')), EMAIL_TIMEOUT)
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
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('❌ SENDGRID_API_KEY or SENDGRID_FROM_EMAIL not configured. Configure in Vercel environment variables.');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
          <h2 style="color:#111827;margin-bottom:8px">Verify your email</h2>
          <p style="color:#6b7280">Your one-time verification code is:</p>
          <h1 style="letter-spacing:8px;color:#4F46E5;font-size:36px;margin:16px 0">${otp}</h1>
          <p style="color:#6b7280;font-size:14px">Valid for 10 minutes. Do not share this code with anyone.</p>
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
