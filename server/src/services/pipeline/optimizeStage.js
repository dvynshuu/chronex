const { DateTime } = require('luxon');

class OptimizeStage {
    /**
     * Identifies optimizations and calculates fairness scores
     * @param {Array} normalizedData - Results from NormalizeStage
     * @param {Object} context - { organization }
     */
    async execute(normalizedData, context) {
        const { organization } = context;
        const recommendations = [];
        
        // 1. Calculate Individual Burden (Fairness Scoring)
        const userBurdens = normalizedData.map(user => {
            const totalMeetingMinutes = user.coordinationBlocks
                .filter(b => b.type === 'busy')
                .reduce((acc, b) => acc + b.durationMinutes, 0);
            
            // Context Switching cost (many meetings)
            const meetingCount = user.coordinationBlocks.filter(b => b.type === 'busy').length;
            const contextSwitchScore = meetingCount * 5; // Arbitrary weight

            // Focus time remaining
            const workDayMinutes = (user.workSchedule.workEnd - user.workSchedule.workStart) * 60;
            const focusMinutes = workDayMinutes - totalMeetingMinutes;

            return {
                userId: user.userId,
                name: user.name,
                burdenScore: (totalMeetingMinutes / 60) + (contextSwitchScore / 10),
                focusMinutes,
                isOverloaded: totalMeetingMinutes > (workDayMinutes * 0.7)
            };
        });

        // 2. Identify Focus Clashes (Team Level)
        // Find meetings that hit peak focus hours (10-15 local) for many people
        normalizedData.forEach(user => {
            user.coordinationBlocks.forEach(block => {
                if (block.type === 'busy') {
                    const localStart = DateTime.fromISO(block.start).setZone(user.timezone);
                    if (localStart.hour >= 10 && localStart.hour <= 15) {
                        recommendations.push({
                            type: 'focus_clash',
                            title: block.title,
                            userId: user.userId,
                            userName: user.name,
                            impact: block.durationMinutes / 60,
                            message: `Moving "${block.title}" could recover peak focus time for ${user.name}.`
                        });
                    }
                }
            });
        });

        return {
            users: normalizedData,
            burdens: userBurdens,
            recommendations: recommendations.slice(0, 10), // Top recommendations
            teamFairnessIndex: this._calculateTeamFairness(userBurdens)
        };
    }

    _calculateTeamFairness(burdens) {
        if (burdens.length === 0) return 100;
        const avgBurden = burdens.reduce((acc, b) => acc + b.burdenScore, 0) / burdens.length;
        const variance = burdens.reduce((acc, b) => acc + Math.pow(b.burdenScore - avgBurden, 2), 0) / burdens.length;
        
        // Return a score from 0-100 where 100 is perfectly equal burden
        return Math.max(0, 100 - (variance * 10));
    }
}

module.exports = new OptimizeStage();
