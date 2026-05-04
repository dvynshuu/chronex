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
            // Check for async hours if in work schedule
            const { asyncHours = { start: 13, end: 15 } } = workSchedule;
            if (hour >= asyncHours.start && hour < asyncHours.end) {
                return {
                    label: 'Deep Work (Async)',
                    icon: '⚡',
                    color: 'var(--color-primary)',
                    range: `${this._formatHour(asyncHours.start)} – ${this._formatHour(asyncHours.end)}`,
                    isAvailable: true,
                    isOverride: false,
                    isAsync: true
                };
            }

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
     * Check if a proposed meeting violates organization norms
     * @param {Date} startTime 
     * @param {Date} endTime 
     * @param {Object} organization 
     * @returns {Object[]} list of violations
     */
    getAgreementViolations(startTime, endTime, organization) {
        const violations = [];
        const start = DateTime.fromJSDate(new Date(startTime)).toUTC();
        const end = DateTime.fromJSDate(new Date(endTime)).toUTC();
        const norms = organization.norms || {};

        // 1. No-Meeting Days
        if (norms.noMeetingDays && norms.noMeetingDays.includes(start.weekday)) {
            violations.push({
                type: 'no_meeting_day',
                severity: norms.enforcementLevel || 'advisory',
                message: `This meeting falls on a designated No-Meeting Day (${start.toFormat('EEEE')}).`
            });
        }

        // 2. Meeting-Free Blocks
        if (norms.meetingFreeBlocks) {
            norms.meetingFreeBlocks.forEach(block => {
                if (start.weekday === block.day) {
                    const blockStart = start.set({ hour: block.start, minute: 0 });
                    const blockEnd = start.set({ hour: block.end, minute: 0 });
                    
                    if ((start >= blockStart && start < blockEnd) || (end > blockStart && end <= blockEnd)) {
                        violations.push({
                            type: 'meeting_free_block',
                            severity: norms.enforcementLevel || 'advisory',
                            message: `Conflicts with a Team Meeting-Free Block (${block.start}:00 - ${block.end}:00).`
                        });
                    }
                }
            });
        }

        // 3. Max Daily Meetings (Requires meeting context, skipping for now or would need a count)
        
        return violations;
    }

    /**
     * Get optimized meeting suggestions respecting norms
     */
    getEnforcedSuggestions(participants, organization, durationMinutes = 30) {
        const overlaps = this.computeOverlap(participants);
        const suggestions = [];
        const norms = organization.norms || {};

        overlaps.forEach(slot => {
            // Filter out slots that violate strict norms
            const startTime = DateTime.utc().startOf('day').plus({ hours: slot.utcHour }).toJSDate();
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
            
            const violations = this.getAgreementViolations(startTime, endTime, organization);
            const isStrictViolation = violations.some(v => v.severity === 'strict');

            if (!isStrictViolation && slot.score >= 0.5) {
                // Check if it hits a handoff window (bonus points)
                const isHandoff = norms.handoffWindows && norms.handoffWindows.some(h => 
                    h.day === DateTime.fromJSDate(startTime).weekday && 
                    slot.utcHour >= h.start && slot.utcHour < h.end
                );

                suggestions.push({
                    utcHour: slot.utcHour,
                    startTime,
                    score: slot.score + (isHandoff ? 0.2 : 0),
                    violations: violations.map(v => v.message),
                    isHandoff
                });
            }
        });

        return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    /**
     * Compute 24h overlap matrix for multiple participants with bitmask-optimized aggregation.
     * Optimized for large teams (O(N) vs O(N*24) expensive operations).
     */
    computeOverlap(participants) {
        const workingCounts = new Int32Array(24);
        const busyCounts = new Int32Array(24);
        const now = DateTime.utc().startOf('day');

        participants.forEach(p => {
            const { zone, workStart = 9, workEnd = 17, commitments = [] } = p;
            
            // 1. Calculate UTC mapping once per participant
            let localOffset;
            try {
                localOffset = now.setZone(zone).offset / 60;
            } catch {
                localOffset = 0;
            }

            // 2. Generate availability bitmasks (24-bit)
            let workMask = 0;
            let busyMask = 0;

            // Map local work hours to UTC bits
            for (let h = workStart; h < workEnd; h++) {
                const utcH = (h - Math.floor(localOffset) + 24) % 24;
                workMask |= (1 << utcH);
            }

            // Map commitments to UTC bits
            commitments.forEach(c => {
                const cStart = DateTime.fromJSDate(new Date(c.startTime)).toUTC();
                const cEnd = DateTime.fromJSDate(new Date(c.endTime)).toUTC();
                
                const startHour = Math.floor(cStart.diff(now, 'hours').hours);
                const endHour = Math.ceil(cEnd.diff(now, 'hours').hours);
                
                for (let h = Math.max(0, startHour); h < Math.min(24, endHour); h++) {
                    busyMask |= (1 << h);
                }
            });

            // 3. Aggregate into histograms
            const availableMask = workMask & ~busyMask;
            for (let h = 0; h < 24; h++) {
                if ((availableMask >> h) & 1) workingCounts[h]++;
                if ((busyMask >> h) & 1) busyCounts[h]++;
            }
        });

        // 4. Construct final results from histograms
        const result = [];
        const numParticipants = participants.length || 1;

        for (let h = 0; h < 24; h++) {
            const workingCount = workingCounts[h];
            const busyCount = busyCounts[h];
            const score = workingCount / numParticipants;
            
            let status;
            if (score === 1) status = 'perfect';
            else if (score >= 0.5) status = 'good';
            else if (busyCount > 0) status = 'conflict';
            else if (score > 0) status = 'partial';
            else status = 'avoid';

            result.push({
                utcHour: h,
                score,
                status,
                workingCount,
                busyCount,
                totalParticipants: numParticipants
                // Note: 'details' array omitted for high-performance mode unless explicitly requested
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
