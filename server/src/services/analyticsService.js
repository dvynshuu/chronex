const logger = require('../utils/logger');

class AnalyticsService {
    constructor() {
        this.metrics = {
            apiCalls: 0,
            activeUsers: new Set(),
            errors: 0
        };
    }

    logRequest(method, path, userId = 'anonymous') {
        this.metrics.apiCalls++;
        if (userId !== 'anonymous') this.metrics.activeUsers.add(userId);
        logger.info(`Analytics: ${method} ${path} by ${userId}`);
    }

    logError(error) {
        this.metrics.errors++;
        logger.error(`Analytics Error: ${error.message}`);
    }

    getStats() {
        return {
            totalApiCalls: this.metrics.apiCalls,
            uniqueActiveUsers: this.metrics.activeUsers.size,
            totalErrors: this.metrics.errors,
            uptime: process.uptime()
        };
    }
}

module.exports = new AnalyticsService();
