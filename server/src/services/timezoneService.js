const { DateTime } = require('luxon');
const availabilityService = require('./availabilityService');

class TimezoneService {
    /**
     * Get current time for multiple timezones
     * @param {Array<string>} zones - Array of IANA timezone strings
     */
    getCurrentTimes(zones) {
        const now = DateTime.utc();
        return zones.map(zone => {
            try {
                const local = now.setZone(zone);
                if (!local.isValid) throw new Error('Invalid timezone');
                return {
                    zone,
                    time: local.toISO(),
                    offset: local.offsetNameShort,
                    isDST: local.isInDST,
                    hour: local.hour,
                    weekday: local.weekday
                };
            } catch (err) {
                // Fallback to UTC for invalid timezone
                const utcFallback = now;
                return {
                    zone,
                    time: utcFallback.toISO(),
                    offset: 'UTC',
                    isDST: false,
                    hour: utcFallback.hour,
                    weekday: utcFallback.weekday,
                    error: 'Invalid timezone, showing UTC'
                };
            }
        });
    }

    /**
     * Compare multiple timezones at a specific UTC time with configurable work hours
     * @param {string} utcTime - ISO UTC time
     * @param {Array<Object>} participants - [{ zone, workStart, workEnd }]
     */
    compareTimezones(utcTime, participants) {
        const base = DateTime.fromISO(utcTime, { zone: 'utc' });
        if (!base.isValid) throw new Error('Invalid base time');

        return participants.map(p => {
            const { zone, workStart = 9, workEnd = 17 } = typeof p === 'string' ? { zone: p } : p;
            let local;
            try {
                local = base.setZone(zone);
                if (!local.isValid) local = base;
            } catch {
                local = base;
            }

            return {
                zone,
                localTime: local.toISO(),
                hour: local.hour,
                isWorkHour: local.hour >= workStart && local.hour < workEnd,
                isSocialHour: (local.hour >= 7 && local.hour < workStart) || (local.hour >= workEnd && local.hour < 22),
                isSleepHour: local.hour >= 22 || local.hour < 7,
                isDST: local.isInDST
            };
        });
    }

    /**
     * Find optimal meeting times for multiple participants with configurable hours
     * @param {Array<Object>} participants - [{ zone, workStart, workEnd }]
     * @param {number} durationHours - Duration of meeting
     */
    findOverlap(participants, durationHours = 1) {
        // Normalise: accept array of strings or objects
        const normalised = participants.map(p =>
            typeof p === 'string' ? { zone: p, workStart: 9, workEnd: 17 } : p
        );

        const suggestions = [];
        const start = DateTime.utc().startOf('hour');

        for (let i = 0; i < 48; i++) {
            const currentUTC = start.plus({ hours: i });
            const comparisons = this.compareTimezones(currentUTC.toISO(), normalised);

            const score = comparisons.reduce((acc, curr) => {
                if (curr.isWorkHour) return acc + 1;
                if (curr.isSocialHour) return acc + 0.5;
                return acc - 2;
            }, 0);

            if (score > (normalised.length * 0.5)) {
                suggestions.push({
                    utcTime: currentUTC.toISO(),
                    hour: currentUTC.hour,
                    score,
                    maxScore: normalised.length,
                    status: score === normalised.length ? 'Perfect' : 'Good',
                    details: comparisons
                });
            }
        }

        return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    /**
     * Get 24h overlap heatmap data for multiple participants
     */
    getOverlapHeatmap(participants) {
        const normalised = participants.map(p =>
            typeof p === 'string' ? { zone: p, workStart: 9, workEnd: 17 } : p
        );
        return availabilityService.computeOverlap(normalised);
    }
}

module.exports = new TimezoneService();

