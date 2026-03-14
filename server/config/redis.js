const Redis = require('ioredis');

const redis = new Redis({
  host: 'redis-12248.crce281.ap-south-1-3.ec2.cloud.redislabs.com',
  port: 12248,
  username: 'default',
  password: 'n5sUl5S0K8RAj2hFAl8UEbP5LEiNkNeJ',
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

redis.on('connect', () => console.log('✅ Redis Connected'));
redis.on('error', (err) => console.error('❌ Redis Error:', err.message));

module.exports = redis;