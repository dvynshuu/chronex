const Analytics = require('../models/Analytics');
const MeetingOutcome = require('../models/MeetingOutcome');
const logger = require('../utils/logger');

class AnalyticsService {
    async logRequest(method, path, userId = 'anonymous') {
        try {
            await Analytics.create({
                type: 'api_call',
                method,
                path,
                userId: userId !== 'anonymous' ? userId : null
            });
            logger.info(`Analytics: ${method} ${path} by ${userId}`);
        } catch (err) {
            logger.error('Failed to log request analytics:', err);
        }
    }

    async logError(error) {
        try {
            await Analytics.create({
                type: 'error',
                metadata: { message: error.message, stack: error.stack }
            });
            logger.error(`Analytics Error: ${error.message}`);
        } catch (err) {
            logger.error('Failed to log error analytics:', err);
        }
    }

    /**
     * Calculate Coordination Intelligence metrics for an organization
     */
    async getCoordinationIntelligence(orgId) {
        try {
            const outcomes = await MeetingOutcome.find({}).populate({
                path: 'user',
                match: { organization: orgId }
            });

            const filteredOutcomes = outcomes.filter(o => o.user); // Only those in the org

            const totalMeetings = filteredOutcomes.length;
            const avgScore = totalMeetings > 0 
                ? filteredOutcomes.reduce((acc, curr) => acc + curr.score, 0) / totalMeetings 
                : 0;
            
            const focusTimeRecovered = filteredOutcomes.reduce((acc, curr) => acc + (curr.metadata.focusTimeImpact || 0), 0);
            const successRate = totalMeetings > 0 
                ? (filteredOutcomes.filter(o => o.wasSuccess).length / totalMeetings) * 100 
                : 0;

            // Sentiment breakdown
            const sentimentStats = filteredOutcomes.reduce((acc, curr) => {
                const label = curr.sentiment.label;
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            }, {});

            return {
                totalMeetings,
                avgScore: avgScore.toFixed(2),
                focusTimeRecoveredMinutes: focusTimeRecovered,
                successRate: successRate.toFixed(1) + '%',
                sentimentStats,
                intelligenceLevel: totalMeetings > 10 ? 'Sophisticated' : 'Learning'
            };
        } catch (err) {
            logger.error('Failed to get coordination intelligence:', err);
            throw err;
        }
    }

    /**
     * Track longitudinal pain reduction (Pain Dropped metric)
     */
    async trackLongitudinalPain(orgId) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const currentPeriod = await MeetingOutcome.find({
                createdAt: { $gte: thirtyDaysAgo }
            }).populate({
                path: 'user',
                match: { organization: orgId }
            });

            const baselinePeriod = await MeetingOutcome.find({
                createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
            }).populate({
                path: 'user',
                match: { organization: orgId }
            });

            const calcFriction = (outcomes) => {
                const valid = outcomes.filter(o => o.user);
                if (valid.length === 0) return 0;
                // Friction = (6 - score) + rescheduleCount + (attendanceRatio inverse?)
                return valid.reduce((acc, curr) => acc + (6 - curr.score) + curr.rescheduleCount, 0) / valid.length;
            };

            const currentFriction = calcFriction(currentPeriod);
            const baselineFriction = calcFriction(baselinePeriod);
            
            const painDropped = baselineFriction > 0 
                ? ((baselineFriction - currentFriction) / baselineFriction) * 100 
                : 0;

            return {
                currentFriction: currentFriction.toFixed(2),
                baselineFriction: baselineFriction.toFixed(2),
                painDropped: painDropped.toFixed(1) + '%',
                status: painDropped > 0 ? 'Improving' : 'Stagnant'
            };
        } catch (err) {
            logger.error('Failed to track longitudinal pain:', err);
            throw err;
        }
    }

    async getStats() {
        try {
            const apiCalls = await Analytics.countDocuments({ type: 'api_call' });
            const activeUsers = await Analytics.distinct('userId', { type: 'api_call', userId: { $ne: null } });
            const errors = await Analytics.countDocuments({ type: 'error' });

            return {
                totalApiCalls: apiCalls,
                uniqueActiveUsers: activeUsers.length,
                totalErrors: errors,
                uptime: process.uptime()
            };
        } catch (err) {
            logger.error('Failed to fetch analytics stats:', err);
            return { error: 'Failed to fetch stats' };
        }
    }
}

module.exports = new AnalyticsService();
