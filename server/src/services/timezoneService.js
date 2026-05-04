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
     * Find optimal meeting times with Fairness & Team Norms awareness.
     * Optimized for performance (O(N) pre-calculation + O(48) aggregation).
     */
    findOverlap(participants, durationHours = 1, options = {}) {
        const { norms = null, members = [] } = options;
        const start = DateTime.utc().startOf('hour');
        
        // 1. Pre-calculate participant status for all 48 hours (O(N * 48) but with fewer expensive calls)
        const participantContexts = participants.map(p => {
            const member = members.find(m => m.user?._id?.toString() === p.userId || m.user?.toString() === p.userId);
            const zone = p.zone || 'UTC';
            const workStart = p.workStart ?? 9;
            const workEnd = p.workEnd ?? 17;
            const fairnessBalance = member?.user?.fairnessBalance ?? 0;
            
            // Generate a 48-hour status profile for this user
            const statusProfile = new Int8Array(48); // 0: sleep, 1: social, 2: work, 3: focus
            const focusStart = norms?.focusWindow?.start ?? 9;
            const focusEnd = norms?.focusWindow?.end ?? 11;

            for (let i = 0; i < 48; i++) {
                const currentUTC = start.plus({ hours: i });
                let local;
                try {
                    local = currentUTC.setZone(zone);
                } catch {
                    local = currentUTC;
                }
                const h = local.hour;

                if (h >= workStart && h < workEnd) {
                    if (h >= focusStart && h < focusEnd) statusProfile[i] = 3;
                    else statusProfile[i] = 2;
                } else if ((h >= 7 && h < workStart) || (h >= workEnd && h < 22)) {
                    statusProfile[i] = 1;
                } else {
                    statusProfile[i] = 0;
                }
            }

            return { statusProfile, fairnessBalance, zone, userId: p.userId, member };
        });

        const suggestions = [];

        // 2. Score each hour using the pre-calculated profiles (O(48 * N) but extremely tight loop)
        for (let i = 0; i < 48; i++) {
            const currentUTC = start.plus({ hours: i });
            let score = 0;
            let fairnessImpact = 0;
            let policyViolations = [];

            if (norms?.noMeetingDays?.includes(currentUTC.weekday)) {
                score -= 5;
                policyViolations.push('No-Meeting Day');
            }

            participantContexts.forEach(ctx => {
                const status = ctx.statusProfile[i];
                
                if (status >= 2) { // Work or Focus
                    score += 1;
                    if (status === 3) {
                        score -= 0.8;
                        policyViolations.push(`${ctx.zone} Focus Window`);
                    }
                    
                    // Attention Cost (only if duration > 30m or complex)
                    if (ctx.member && durationHours > 0.5) {
                        // Inline simplified attention cost to avoid re-imports in loop
                        score -= 0.1; 
                    }
                } else if (status === 1) { // Social
                    score += 0.3;
                    fairnessImpact += 1;
                } else { // Sleep
                    score -= 3;
                    fairnessImpact += 5;
                }

                // Fairness weighting
                if (status < 2 && ctx.fairnessBalance > 5) {
                    score -= (ctx.fairnessBalance / 10);
                }
            });

            const maxPotential = participants.length;
            if (score > (maxPotential * 0.3)) {
                suggestions.push({
                    utcTime: currentUTC.toISO(),
                    hour: currentUTC.hour,
                    weekday: currentUTC.weekday,
                    score: Math.round(score * 10) / 10,
                    maxScore: maxPotential,
                    status: score >= maxPotential * 0.8 ? 'Perfect' : (score >= maxPotential * 0.5 ? 'Good' : 'Fair'),
                    fairnessImpact,
                    policyViolations: [...new Set(policyViolations)]
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

