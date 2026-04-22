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
     * Find optimal meeting times with Fairness & Team Norms awareness
     */
    findOverlap(participants, durationHours = 1, options = {}) {
        const { norms = null, members = [] } = options;
        
        const normalised = participants.map(p => {
            const member = members.find(m => m.user?._id?.toString() === p.userId || m.user?.toString() === p.userId);
            return {
                zone: p.zone || 'UTC',
                workStart: p.workStart ?? 9,
                workEnd: p.workEnd ?? 17,
                userId: p.userId,
                fairnessBalance: member?.user?.fairnessBalance ?? 0
            };
        });

        const suggestions = [];
        const start = DateTime.utc().startOf('hour');

        for (let i = 0; i < 48; i++) {
            const currentUTC = start.plus({ hours: i });
            const comparisons = this.compareTimezones(currentUTC.toISO(), normalised);
            
            let score = 0;
            let fairnessImpact = 0;
            let policyViolations = [];

            // 1. Check Norms (No-Meeting Days)
            if (norms?.noMeetingDays?.includes(currentUTC.weekday)) {
                score -= 5;
                policyViolations.push('No-Meeting Day');
            }

            comparisons.forEach((curr, idx) => {
                const p = normalised[idx];
                const member = members[idx]?.user;
                
                // 2. Base Score
                if (curr.isWorkHour) {
                    score += 1;
                    // Check Focus Window
                    if (norms?.focusWindow && curr.hour >= norms.focusWindow.start && curr.hour < norms.focusWindow.end) {
                        score -= 0.8;
                        policyViolations.push(`${p.zone} Focus Window`);
                    }

                    // 2.1 Attention Cost (Context Switching)
                    if (member) {
                        const coordinationService = require('./coordinationService');
                        const attentionCost = coordinationService.calculateAttentionCost(currentUTC.toISO(), durationHours * 60, member);
                        if (attentionCost > 0) {
                            score -= (attentionCost * 0.2);
                            policyViolations.push(`${p.zone} Attention Cost`);
                        }
                    }
                } else if (curr.isSocialHour) {
                    score += 0.3; // Lowered from 0.5 to prioritize work hours more
                    fairnessImpact += 1; // Alice takes a social hit
                } else {
                    score -= 3; // Harsher penalty for sleep hours
                    fairnessImpact += 5; // Major hit
                }

                // 3. Fairness Weighting
                // If a user has a high fairnessBalance (they've taken hits before), 
                // we penalize this slot MORE if it hits them again.
                if (!curr.isWorkHour && p.fairnessBalance > 5) {
                    score -= (p.fairnessBalance / 10);
                }
            });

            const maxPotential = normalised.length;
            if (score > (maxPotential * 0.3)) { // Lowered threshold because of harsher penalties
                suggestions.push({
                    utcTime: currentUTC.toISO(),
                    hour: currentUTC.hour,
                    weekday: currentUTC.weekday,
                    score: Math.round(score * 10) / 10,
                    maxScore: maxPotential,
                    status: score >= maxPotential * 0.8 ? 'Perfect' : (score >= maxPotential * 0.5 ? 'Good' : 'Fair'),
                    fairnessImpact,
                    policyViolations: [...new Set(policyViolations)],
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

