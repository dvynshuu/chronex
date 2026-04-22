const googleCalendarService = require('../googleCalendarService');
const userRepository = require('../../repositories/userRepository');

class IngestStage {
    /**
     * Aggregates raw data from various sources
     * @param {Object} context - { userIds, timeRange }
     */
    async execute(context) {
        const { userIds, timeRange } = context;
        const results = [];

        for (const userId of userIds) {
            const user = await userRepository.findById(userId);
            if (!user) continue;

            const userData = {
                userId,
                name: user.name,
                timezone: user.baseTimezone || 'UTC',
                workSchedule: user.workSchedule || {},
                rawEvents: []
            };

            // 1. Google Calendar Ingestion
            if (user.googleAccessToken) {
                try {
                    const tokens = {
                        access_token: user.googleAccessToken,
                        refresh_token: user.googleRefreshToken,
                        token_type: 'Bearer',
                        expiry_date: user.googleTokenExpiry
                    };
                    const events = await googleCalendarService.getCalendarEvents(
                        tokens, 
                        timeRange?.start, 
                        timeRange?.end
                    );
                    
                    userData.rawEvents.push(...(events || []).map(e => ({
                        source: 'google_calendar',
                        id: e.id,
                        title: e.summary,
                        start: e.start.dateTime || e.start.date,
                        end: e.end.dateTime || e.end.date,
                        isRecurring: !!e.recurringEventId,
                        status: e.status
                    })));
                } catch (error) {
                    console.warn(`[Ingest] Failed to fetch GCal for user ${userId}:`, error.message);
                }
            }

            // 2. Presence Ingestion (Mocked for now)
            userData.presence = {
                status: 'active', // Default
                lastActive: new Date()
            };

            results.push(userData);
        }

        return results;
    }
}

module.exports = new IngestStage();
