const { DateTime } = require('luxon');

class CoordinationService {
    /**
     * Calculate Coordination Pain Index (CPI) for a team/organization
     */
    calculateCPI(members) {
        let sleepDisruption = 0;
        let contextSwitching = 0;
        let fairnessImbalance = 0;

        members.forEach(m => {
            const user = m.user;
            if (!user) return;

            // 1. Sleep Disruption (from feedback and fairness balance)
            sleepDisruption += (user.fairnessBalance || 0);
            
            // 2. Context Switching (Attention Cost)
            // If they have many small feedback scores or recent many small commitments
            const feedback = user.meetingFeedback || [];
            const lowPainReduction = feedback.filter(f => !f.painReduced).length;
            contextSwitching += lowPainReduction * 2;

            // 3. Fairness Imbalance
            // Difference between their balance and the team average
        });

        const avgBalance = members.reduce((acc, m) => acc + (m.user?.fairnessBalance || 0), 0) / (members.length || 1);
        fairnessImbalance = members.reduce((acc, m) => acc + Math.abs((m.user?.fairnessBalance || 0) - avgBalance), 0);

        const totalPain = (sleepDisruption * 0.4) + (contextSwitching * 0.4) + (fairnessImbalance * 0.2);
        
        return {
            index: Math.max(0, 100 - (totalPain / (members.length || 1))),
            factors: {
                sleepDisruption: Math.min(100, sleepDisruption / (members.length || 1)),
                attentionCost: Math.min(100, contextSwitching / (members.length || 1)),
                inequity: Math.min(100, fairnessImbalance / (members.length || 1))
            }
        };
    }

    /**
     * Calculate Attention Cost for a specific meeting slot
     */
    calculateAttentionCost(startTime, durationMinutes, user) {
        const start = DateTime.fromISO(startTime).toUTC();
        const end = start.plus({ minutes: durationMinutes });
        
        // Find adjacent commitments
        const commitments = user.commitments || [];
        let cost = 0;

        // If this meeting splits a long free block into two blocks smaller than minDeepWorkBlock
        const workStart = DateTime.fromObject({ hour: user.workSchedule?.workStart || 9 }, { zone: user.baseTimezone }).toUTC();
        const workEnd = DateTime.fromObject({ hour: user.workSchedule?.workEnd || 17 }, { zone: user.baseTimezone }).toUTC();

        // Simplified: if meeting is in middle of day, it's higher cost than start/end
        const localStart = start.setZone(user.baseTimezone);
        if (localStart.hour > 10 && localStart.hour < 15) {
            cost += 2; // Peak focus hours hit
        }

        return cost;
    }
    /**
     * Identify potential focus time recovery from scheduled meetings
     */
    calculateFocusRecovery(meetings, users) {
        let potentialRecoveredHours = 0;
        const optimizations = [];

        meetings.forEach(meeting => {
            const start = DateTime.fromJSDate(meeting.startTime).toUTC();
            const hour = start.hour;

            // If meeting is in "Peak Focus" (10-15 local) for > 50% participants
            let focusHitCount = 0;
            meeting.participants.forEach(pId => {
                const user = users.find(u => u._id.toString() === pId.toString());
                if (!user) return;
                const localHour = start.setZone(user.baseTimezone).hour;
                if (localHour >= 10 && localHour <= 15) focusHitCount++;
            });

            if (focusHitCount > meeting.participants.length / 2) {
                const recovery = meeting.duration / 60;
                potentialRecoveredHours += recovery;
                optimizations.push({
                    meetingId: meeting._id,
                    title: meeting.title,
                    type: 'focus_clash',
                    impact: recovery,
                    message: `${Math.round(recovery * 10) / 10}h focus time can be reclaimed by moving this.`
                });
            }
        });

        return {
            totalRecovery: Math.round(potentialRecoveredHours * 10) / 10,
            optimizations
        };
    }
}

module.exports = new CoordinationService();
