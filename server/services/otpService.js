const crypto = require('crypto');
const nodemailer = require('nodemailer');
const redis = require('../config/redis');

const OTP_EXPIRY = 600;

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailOtp = async (userId, email) => {
  const otp = generateOTP();
  await redis.set(`otp:email:${userId}`, otp, { ex: OTP_EXPIRY });

  await transporter.sendMail({
    from: `"Your App" <${process.env.EMAIL_USER}>`,
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
};

const verifyOtp = async (userId, otp, type) => {
  const key = `otp:${type}:${userId}`;
  const stored = await redis.get(key);

  if (!stored) throw new Error('OTP expired or not found');
  if (stored !== otp) throw new Error('Invalid OTP');

  await redis.del(key);
  return true;
};

module.exports = { sendEmailOtp, verifyOtp };