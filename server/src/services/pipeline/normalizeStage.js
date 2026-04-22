const { DateTime } = require('luxon');

class NormalizeStage {
    /**
     * Normalizes raw data into structured coordination blocks
     * @param {Array} rawData - Results from IngestStage
     * @param {Object} context - { organization }
     */
    async execute(rawData, context) {
        const { organization } = context;
        const norms = organization?.norms || {};

        return rawData.map(user => {
            const normalizedBlocks = [];
            
            // 1. Convert work schedule to blocks for the current period
            // (Simplified: assuming we are looking at 'today')
            const userTz = user.timezone;
            const now = DateTime.now().setZone(userTz);
            
            // 2. Process Calendar Events into busy blocks
            user.rawEvents.forEach(event => {
                const start = DateTime.fromISO(event.start).toUTC();
                const end = DateTime.fromISO(event.end).toUTC();
                
                normalizedBlocks.push({
                    type: 'busy',
                    source: event.source,
                    title: event.title,
                    start: start.toISO(),
                    end: end.toISO(),
                    durationMinutes: end.diff(start, 'minutes').minutes,
                    isRecurring: event.isRecurring
                });
            });

            // 3. Apply Norms (e.g., No-Meeting Blocks)
            // If the user's local day is a no-meeting day, mark it
            const localDay = now.weekday; // 1-7
            const isNoMeetingDay = norms.noMeetingDays?.includes(localDay);

            return {
                ...user,
                coordinationBlocks: normalizedBlocks,
                status: {
                    isNoMeetingDay,
                    currentWorkBlock: this._calculateCurrentWorkBlock(user.workSchedule, userTz)
                }
            };
        });
    }

    _calculateCurrentWorkBlock(schedule, timezone) {
        const now = DateTime.now().setZone(timezone);
        const { workStart = 9, workEnd = 17, workDays = [1, 2, 3, 4, 5] } = schedule;
        
        const isWorkDay = workDays.includes(now.weekday);
        const isWorkHour = now.hour >= workStart && now.hour < workEnd;

        return {
            isWorkDay,
            isWorkHour,
            remainingHours: isWorkHour ? workEnd - now.hour : 0
        };
    }
}

module.exports = new NormalizeStage();
