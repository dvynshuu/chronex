import React from 'react';
import { DateTime } from 'luxon';
import './ClockCard.css';

const ClockCard = ({ city, zone, utcTime }) => {
    const localTime = utcTime.setZone(zone);

    const getContext = (hour) => {
        if (hour >= 22 || hour < 5) return { label: 'Sleeping', icon: '🌙', color: 'var(--color-danger)', range: '22:00 - 05:00' };
        if (hour >= 18 || hour < 9) return { label: 'Off Hours', icon: '🏠', color: 'var(--color-warning)', range: '18:00 - 09:00' };
        return { label: 'In Office', icon: '💼', color: 'var(--color-success)', range: '09:00 - 18:00' };
    };

    const context = getContext(localTime.hour);

    return (
        <div className="clock-card glass-panel">
            <div className="clock-card__header">
                <h3 className="clock-card__city">{city}</h3>
                <span className="clock-card__zone">{zone}</span>
            </div>

            <div className="clock-card__time-display">
                <div className="clock-card__main-time anim-pulse-glow">
                    {localTime.toFormat('HH:mm')}
                </div>
                <p className="clock-card__date">{localTime.toFormat('EEE, MMM dd')}</p>
            </div>

            <div
                className="clock-card__status"
                style={{ '--status-color': context.color }}
            >
                <div className="clock-card__status-info">
                    <span className="clock-card__status-indicator">{context.icon} {context.label}</span>
                    <span className="clock-card__status-range">{context.range}</span>
                </div>
            </div>
        </div>
    );
};

export default ClockCard;
