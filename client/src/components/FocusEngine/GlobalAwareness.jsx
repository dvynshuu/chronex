import React, { useMemo } from 'react';
import { useFocusContext } from './FocusContext';

const cities = [
    { id: 'sf', label: 'San Francisco', timeZone: 'America/Los_Angeles', workStartHour: 9, workEndHour: 17 },
    { id: 'ny', label: 'New York', timeZone: 'America/New_York', workStartHour: 9, workEndHour: 18 },
    { id: 'lon', label: 'London', timeZone: 'Europe/London', workStartHour: 9, workEndHour: 18 },
    { id: 'ber', label: 'Berlin', timeZone: 'Europe/Berlin', workStartHour: 9, workEndHour: 18 },
    { id: 'blr', label: 'Bengaluru', timeZone: 'Asia/Kolkata', workStartHour: 10, workEndHour: 19 },
    { id: 'tok', label: 'Tokyo', timeZone: 'Asia/Tokyo', workStartHour: 9, workEndHour: 18 }
];

const getHourInZone = (timeZone) => {
    const fmt = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone
    });
    const parts = fmt.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : 0;
};

const GlobalAwareness = () => {
    const { state } = useFocusContext();
    const { timer } = state;

    const enriched = useMemo(() => {
        return cities.map((city) => {
            const hour = getHourInZone(city.timeZone);
            const inWorkHours = hour >= city.workStartHour && hour < city.workEndHour;
            return { ...city, hour, inWorkHours };
        });
    }, [timer.isRunning, timer.mode]);

    const workCities = enriched.filter((c) => c.inWorkHours);
    const restCities = enriched.filter((c) => !c.inWorkHours);

    const offHoursLocal = (() => {
        const d = new Date();
        const h = d.getHours();
        return h < 6 || h >= 22;
    })();

    return (
        <div className="ce-panel ce-awareness-panel">
            <div className="ce-awareness-header">
                <div>
                    <h3 className="ce-panel-title">
                        {timer.mode === 'focus' && timer.isRunning ? 'In Focus Mode' : 'Global rhythm'}
                    </h3>
                    <p className="ce-panel-subtitle">
                        Timezone intelligence around your current session.
                    </p>
                </div>
                {timer.mode === 'focus' && timer.isRunning && (
                    <div className="ce-focus-pill">Focus shield active</div>
                )}
            </div>

            <div className="ce-awareness-body">
                <div className="ce-awareness-column">
                    <div className="ce-awareness-label">Within work hours</div>
                    <div className="ce-awareness-list">
                        {workCities.map((c) => (
                            <div key={c.id} className="ce-city-row is-active">
                                <span className="ce-city-name">{c.label}</span>
                                <span className="ce-city-time">
                                    {String(c.hour).padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}
                        {workCities.length === 0 && (
                            <div className="ce-empty-state-sm">No hubs currently in work hours.</div>
                        )}
                    </div>
                </div>
                <div className="ce-awareness-column">
                    <div className="ce-awareness-label">Outside work hours</div>
                    <div className="ce-awareness-list">
                        {restCities.map((c) => (
                            <div key={c.id} className="ce-city-row is-dimmed">
                                <span className="ce-city-name">{c.label}</span>
                                <span className="ce-city-time">
                                    {String(c.hour).padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {offHoursLocal && timer.mode === 'focus' && timer.isRunning && (
                <div className="ce-offhours-banner">
                    You’re starting focus during local sleep hours. Protect recovery while aligning
                    with your global team.
                </div>
            )}
        </div>
    );
};

export default GlobalAwareness;

