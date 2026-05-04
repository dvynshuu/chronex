const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const logger = require('../utils/logger');
const User = require('../models/User');
const Organization = require('../models/Organization');
const timezoneService = require('../services/timezoneService');
const socketService = require('../services/socketService');

const startMeetingWorker = () => {
    const worker = new Worker('meeting-events', async (job) => {
        const { name, data } = job;
        logger.info(`[MEETING-WORKER] Processing job ${job.id} of type ${name}`);

        try {
            if (name === 'MEETING_SCHEDULED') {
                const { participants, startTime, orgId, meetingId, title } = data;

                // 1. Calculate and update Fairness Balance
                const organization = await Organization.findById(orgId);
                if (organization?.norms?.fairnessEnabled) {
                    const utcTime = new Date(startTime).toISOString();
                    const stats = timezoneService.compareTimezones(utcTime, participants);

                    for (let i = 0; i < participants.length; i++) {
                        const p = participants[i];
                        const stat = stats[i];
                        if (!p.userId) continue;

                        let hit = 0;
                        if (stat.isSleepHour) hit = 5;
                        else if (stat.isSocialHour) hit = 1;

                        if (hit > 0) {
                            await User.findByIdAndUpdate(p.userId, { $inc: { fairnessBalance: hit } });
                            logger.info(`[MEETING-WORKER] Increased fairness hit (+${hit}) for user ${p.userId}`);
                        } else if (stat.isWorkHour) {
                            await User.findByIdAndUpdate(p.userId, { $inc: { fairnessBalance: -0.2 } });
                            logger.info(`[MEETING-WORKER] Reduced fairness hit (-0.2) for user ${p.userId}`);
                        }
                    }
                }

                // 2. Send Real-time Notifications via Sockets
                // Notify all organization members about the new meeting
                socketService.emitToOrg(orgId, 'notification:meeting_scheduled', {
                    meetingId,
                    title,
                    message: `A new meeting "${title}" has been scheduled.`,
                    timestamp: new Date()
                });

                logger.info(`[MEETING-WORKER] Successfully processed MEETING_SCHEDULED for ${meetingId}`);
            }
        } catch (err) {
            logger.error(`[MEETING-WORKER] Error processing job ${job.id}`, err);
            throw err; // Allow BullMQ to retry based on strategy
        }
    }, {
        connection: redisConnection,
        concurrency: 5
    });

    worker.on('completed', (job) => {
        logger.info(`[MEETING-WORKER] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[MEETING-WORKER] Job ${job.id} failed: ${err.message}`);
    });

    logger.info('[MEETING-WORKER] Worker initialized and listening for jobs');
};

module.exports = { startMeetingWorker };
