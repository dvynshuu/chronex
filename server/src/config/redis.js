const IORedis = require('ioredis');
const logger = require('../utils/logger');

const redisOptions = {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
};

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

redisConnection.on('error', (err) => {
    logger.error('[REDIS] Connection Error', err);
});

redisConnection.on('connect', () => {
    logger.info('[REDIS] Connected to Redis');
});

module.exports = redisConnection;
