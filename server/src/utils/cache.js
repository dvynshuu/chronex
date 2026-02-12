const redis = require('redis');
const logger = require('./logger');

let client;

if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    client = redis.createClient({ url: process.env.REDIS_URL });

    client.on('error', (err) => logger.error('Redis Client Error', err));
    client.on('connect', () => logger.info('Redis Client Connected'));

    client.connect().catch(err => logger.error('Redis connection failed', err));
} else {
    logger.info('Redis URL not found or development mode, using memory-only caching (Mock)');
    // Simple mock for local development without Redis
    client = {
        get: async () => null,
        set: async () => 'OK',
        setEx: async () => 'OK',
        connect: async () => { },
        on: () => { }
    };
}

module.exports = client;
