const Redis = require('ioredis');
const { get } = require('./config');
const { logger } = require('./logger');

const redis = new Redis({
  host: get('redis.host'),
  port: get('redis.port'),
  password: get('redis.password'),
});

redis.on('error', error => {
  logger.error(`ioredis: ${error.message}`);
});

module.exports = redis;
