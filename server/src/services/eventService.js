const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');
const logger = require('../utils/logger');

// Define the meeting queue
const meetingQueue = new Queue('meeting-events', {
    connection: redisConnection
});

const eventService = {
    /**
     * Dispatch an event to the meeting queue
     * @param {string} eventName - Type of event (e.g., 'MEETING_SCHEDULED')
     * @param {object} payload - Data associated with the event
     */
    async dispatchMeetingEvent(eventName, payload) {
        try {
            await meetingQueue.add(eventName, payload, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true
            });
            logger.info(`[EVENT-SERVICE] Dispatched ${eventName}`);
        } catch (err) {
            logger.error(`[EVENT-SERVICE] Failed to dispatch ${eventName}`, err);
            // Fallback: log it or retry? For now, just log.
        }
    }
};

module.exports = eventService;
