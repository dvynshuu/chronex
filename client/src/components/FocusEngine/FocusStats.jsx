import React, { useMemo } from 'react';
import { useFocusContext } from './FocusContext';

const getRecentDates = (days) => {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
    }
    return dates;
};

const FocusStats = () => {
    const { state } = useFocusContext();
    const { stats } = state;

    const recent = useMemo(() => {
        const keys = getRecentDates(14);
        return keys.map((dateKey) => {
            const entry =
                dateKey === stats.currentDay
                    ? stats.today
                    : stats.history[dateKey] || { focusMinutes: 0, sessionsCompleted: 0 };
            return { dateKey, ...entry };
        });
    }, [stats]);

    const maxMinutes = recent.reduce((max, d) => Math.max(max, d.focusMinutes), 0);

    return (
        <div className="ce-panel ce-stats-panel">
            <div className="ce-panel-header">
                <div>
                    <h3 className="ce-panel-title">Session history</h3>
                    <p className="ce-panel-subtitle">
                        Stripe-level telemetry for your deep work.
                    </p>
                </div>
            </div>

            <div className="ce-stats-grid">
                <div className="ce-stat-card">
                    <div className="ce-stat-label">Focus minutes today</div>
                    <div className="ce-stat-value">{stats.today.focusMinutes}</div>
                </div>
                <div className="ce-stat-card">
                    <div className="ce-stat-label">Sessions completed</div>
                    <div className="ce-stat-value">{stats.today.sessionsCompleted}</div>
                </div>
                <div className="ce-stat-card">
                    <div className="ce-stat-label">Current streak</div>
                    <div className="ce-stat-value">{stats.streak}</div>
                </div>
            </div>

            <div className="ce-heatmap">
                {recent.map((d) => {
                    const intensity = maxMinutes === 0 ? 0 : d.focusMinutes / maxMinutes || 0;
                    let tier = 'none';
                    if (intensity > 0.66) tier = 'high';
                    else if (intensity > 0.33) tier = 'med';
                    else if (intensity > 0) tier = 'low';

                    return (
                        <div key={d.dateKey} className="ce-heatmap-cell">
                            <div className={`ce-heatmap-dot tier-${tier}`} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FocusStats;

