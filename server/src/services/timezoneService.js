const { DateTime } = require('luxon');

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
                return {
                    zone,
                    time: local.toISO(),
                    offset: local.offsetNameShort,
                    isDST: local.isInDST
                };
            } catch (err) {
                return { zone, error: 'Invalid timezone' };
            }
        });
    }

    /**
     * Compare multiple timezones at a specific UTC time
     * @param {string} utcTime - ISO UTC time
     * @param {Array<string>} zones - Array of IANA timezone strings
     */
    compareTimezones(utcTime, zones) {
        const base = DateTime.fromISO(utcTime, { zone: 'utc' });
        if (!base.isValid) throw new Error('Invalid base time');

        return zones.map(zone => {
            const local = base.setZone(zone);
            return {
                zone,
                localTime: local.toISO(),
                hour: local.hour,
                isWorkHour: local.hour >= 9 && local.hour < 17,
                isSocialHour: (local.hour >= 7 && local.hour < 9) || (local.hour >= 17 && local.hour < 22),
                isSleepHour: local.hour >= 22 || local.hour < 7
            };
        });
    }

    /**
     * Find optimal meeting times for multiple participants
     * @param {Array<string>} participantZones - Array of timezones
     * @param {number} durationHours - Duration of meeting
     */
    findOverlap(participantZones, durationHours = 1) {
        const suggestions = [];
        // Check next 48 hours for overlap
        const start = DateTime.utc().startOf('hour');

        for (let i = 0; i < 48; i++) {
            const currentUTC = start.plus({ hours: i });
            const comparisons = this.compareTimezones(currentUTC.toISO(), participantZones);

            const score = comparisons.reduce((acc, curr) => {
                if (curr.isWorkHour) return acc + 1;
                if (curr.isSocialHour) return acc + 0.5;
                return acc - 2; // High penalty for sleep
            }, 0);

            if (score > (participantZones.length * 0.5)) {
                suggestions.push({
                    utcTime: currentUTC.toISO(),
                    score,
                    status: score === participantZones.length ? 'Perfect' : 'Good'
                });
            }
        }

        return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
    }
}

module.exports = new TimezoneService();
