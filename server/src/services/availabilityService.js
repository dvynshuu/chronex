const { DateTime } = require('luxon');

class AvailabilityService {
    /**
     * Get auto-status for a user based on their work schedule and timezone
     * @param {Object} workSchedule - { workStart, workEnd, workDays }
     * @param {string} timezone - IANA timezone string
     * @param {Object} statusOverride - { label, expiry } optional manual override
     * @returns {Object} { label, icon, color, range, isAvailable }
     */
    getStatus(workSchedule = {}, timezone = 'UTC', statusOverride = null) {
        // Check manual override first
        if (statusOverride && statusOverride.label && statusOverride.expiry) {
            const expiry = DateTime.fromJSDate(new Date(statusOverride.expiry));
            if (expiry > DateTime.utc()) {
                return {
                    label: statusOverride.label,
                    icon: '🔵',
                    color: 'var(--color-accent)',
                    range: `Until ${expiry.setZone(timezone).toFormat('HH:mm')}`,
                    isAvailable: false,
                    isOverride: true
                };
            }
        }

        const { workStart = 9, workEnd = 17, workDays = [1, 2, 3, 4, 5] } = workSchedule;

        let localNow;
        try {
            localNow = DateTime.utc().setZone(timezone);
            if (!localNow.isValid) localNow = DateTime.utc();
        } catch {
            localNow = DateTime.utc();
        }

        const hour = localNow.hour;
        const dayOfWeek = localNow.weekday; // 1=Mon, 7=Sun (Luxon)
        const isWorkDay = workDays.includes(dayOfWeek);

        if (!isWorkDay) {
            return {
                label: 'Day Off',
                icon: '🏖️',
                color: 'var(--color-text-dim)',
                range: 'Non-working day',
                isAvailable: false,
                isOverride: false
            };
        }

        if (hour >= workStart && hour < workEnd) {
            return {
                label: 'Available',
                icon: '🟢',
                color: 'var(--color-success)',
                range: `${this._formatHour(workStart)} – ${this._formatHour(workEnd)}`,
                isAvailable: true,
                isOverride: false
            };
        }

        if (hour >= 22 || hour < 5) {
            return {
                label: 'Sleeping',
                icon: '🌙',
                color: 'var(--color-night)',
                range: '10 PM – 5 AM',
                isAvailable: false,
                isOverride: false
            };
        }

        if (hour >= 5 && hour < workStart) {
            return {
                label: 'Early Morning',
                icon: '🌅',
                color: 'var(--color-day)',
                range: `5 AM – ${this._formatHour(workStart)}`,
                isAvailable: false,
                isOverride: false
            };
        }

        return {
            label: 'Off Hours',
            icon: '🏠',
            color: 'var(--color-sunset)',
            range: `${this._formatHour(workEnd)} – 10 PM`,
            isAvailable: false,
            isOverride: false
        };
    }

    /**
     * Compute 24h overlap matrix for multiple participants
     * @param {Array} participants - [{ zone, workStart, workEnd }]
     * @returns {Array} 24 entries with overlap scores
     */
    computeOverlap(participants) {
        const result = [];
        const now = DateTime.utc().startOf('day');

        for (let h = 0; h < 24; h++) {
            const utcHour = now.plus({ hours: h });
            let workingCount = 0;
            const details = [];

            participants.forEach(p => {
                const { zone, workStart = 9, workEnd = 17 } = p;
                let local;
                try {
                    local = utcHour.setZone(zone);
                    if (!local.isValid) local = utcHour;
                } catch {
                    local = utcHour;
                }

                const localHour = local.hour;
                const isWorking = localHour >= workStart && localHour < workEnd;
                if (isWorking) workingCount++;

                details.push({
                    zone,
                    localHour,
                    localTime: local.toFormat('HH:mm'),
                    isWorking
                });
            });

            const score = workingCount / participants.length;
            let status;
            if (score === 1) status = 'perfect';
            else if (score >= 0.5) status = 'good';
            else if (score > 0) status = 'partial';
            else status = 'avoid';

            result.push({
                utcHour: h,
                score,
                maxScore: 1,
                status,
                workingCount,
                totalParticipants: participants.length,
                details
            });
        }

        return result;
    }

    /**
     * Find next availability window for a user
     */
    getNextAvailability(workSchedule = {}, timezone = 'UTC') {
        const { workStart = 9, workEnd = 17, workDays = [1, 2, 3, 4, 5] } = workSchedule;

        let localNow;
        try {
            localNow = DateTime.utc().setZone(timezone);
            if (!localNow.isValid) localNow = DateTime.utc();
        } catch {
            localNow = DateTime.utc();
        }

        // Search up to 7 days ahead
        for (let d = 0; d < 7; d++) {
            const checkDay = localNow.plus({ days: d });
            if (!workDays.includes(checkDay.weekday)) continue;

            const startOfWork = checkDay.set({ hour: workStart, minute: 0, second: 0 });

            if (startOfWork > localNow) {
                return {
                    time: startOfWork.toISO(),
                    formatted: startOfWork.toFormat('EEE, MMM dd HH:mm'),
                    hoursUntil: startOfWork.diff(localNow, 'hours').hours.toFixed(1)
                };
            }

            // If we're before workEnd today
            if (d === 0 && localNow.hour < workEnd) {
                return {
                    time: localNow.toISO(),
                    formatted: 'Now',
                    hoursUntil: 0
                };
            }
        }

        return { time: null, formatted: 'No upcoming availability', hoursUntil: null };
    }

    _formatHour(h) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${display} ${ampm}`;
    }
}

module.exports = new AvailabilityService();
