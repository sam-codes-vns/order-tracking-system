const { Redis } = require('@upstash/redis');

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn(
    '⚠️  Missing Upstash Redis credentials (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). ' +
    'OTP storage will be unavailable until these are configured in your environment.'
  );
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

module.exports = redis;