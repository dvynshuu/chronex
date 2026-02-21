import React, { useMemo, memo } from 'react';
import { DateTime } from 'luxon';
import './ClockCard.css';

const ClockCard = memo(({ city, zone, baseTime, workStart = 9, workEnd = 17, isLocal = false, onRemove }) => {
    let localTime;
    let isInvalidZone = false;
    try {
        localTime = baseTime.setZone(zone);
        if (!localTime.isValid) throw new Error();
    } catch {
        localTime = baseTime; // Fallback to current zone reference
        isInvalidZone = true;
    }

    const hour = localTime.hour;
    const minute = localTime.minute;

    const getTimeGradient = (h) => {
        if (h >= 20 || h < 5) return 'linear-gradient(135deg, #1e1b4b 0%, #020617 100%)';
        if (h >= 17) return 'linear-gradient(135deg, #f43f5e 0%, #1e1b4b 100%)';
        if (h >= 9) return 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)';
        return 'linear-gradient(135deg, #fbbf24 0%, #f43f5e 100%)';
    };

    const status = useMemo(() => {
        if (hour >= workStart && hour < workEnd) {
            return { label: 'Available', icon: '🟢', color: 'var(--color-success)', range: `${fmtHr(workStart)} – ${fmtHr(workEnd)}` };
        }
        if (hour >= 22 || hour < 5) {
            return { label: 'Sleeping', icon: '🌙', color: 'var(--color-night)', range: '10 PM – 5 AM' };
        }
        if (hour >= 5 && hour < workStart) {
            return { label: 'Early Morning', icon: '🌅', color: 'var(--color-day)', range: `5 AM – ${fmtHr(workStart)}` };
        }
        return { label: 'Off Hours', icon: '🏠', color: 'var(--color-sunset)', range: `${fmtHr(workEnd)} – 10 PM` };
    }, [hour, workStart, workEnd]);

    // Day progress: percentage of day elapsed
    const dayProgress = ((hour * 60 + minute) / 1440) * 100;
    const progressAngle = (dayProgress / 100) * 360;
    const circumference = 2 * Math.PI * 22;
    const strokeDashoffset = circumference - (circumference * dayProgress / 100);

    // Weekday indicator (1=Mon, 7=Sun)
    const weekday = localTime.weekday;
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Minute digits for flip animation
    const timeStr = localTime.toFormat('hh:mm a');
    const isDST = localTime.isInDST;

    return (
        <div
            className={`clock-card glass-panel ${isLocal ? 'clock-card--local' : ''}`}
            style={{ '--card-gradient': getTimeGradient(hour) }}
        >
            {isInvalidZone && (
                <div className="clock-card__warning">⚠️ Invalid timezone – showing UTC</div>
            )}

            <div className="clock-card__header">
                <div className="clock-card__city-group">
                    <h3 className="clock-card__city">{city}</h3>
                    <span className="clock-card__zone">{zone}</span>
                </div>
                <div className="clock-card__header-actions">
                    {isDST && <span className="clock-card__dst-badge">DST</span>}
                    {onRemove && (
                        <button
                            className="clock-card__remove"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            title="Remove city"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            <div className="clock-card__body">
                {/* Day Progress Ring */}
                <div className="clock-card__progress-ring">
                    <svg viewBox="0 0 48 48" className="clock-card__ring-svg">
                        <circle cx="24" cy="24" r="22" className="clock-card__ring-bg" />
                        <circle
                            cx="24" cy="24" r="22"
                            className="clock-card__ring-fill"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                                stroke: status.color
                            }}
                        />
                    </svg>
                    <span className="clock-card__progress-pct">{Math.round(dayProgress)}%</span>
                </div>

                {/* Flip Clock Display */}
                <div className="clock-card__time-display">
                    <div className="clock-card__flip-clock">
                        {timeStr.split('').map((char, i) => (
                            <span
                                key={`${i}-${char}`}
                                className={`clock-card__digit ${char === ':' ? 'clock-card__digit--colon' : ''}`}
                            >
                                <span className="clock-card__digit-inner">{char}</span>
                            </span>
                        ))}
                    </div>
                    <p className="clock-card__date">{localTime.toFormat('EEE, MMM dd')}</p>
                </div>
            </div>

            {/* Weekday Mini Bar */}
            <div className="clock-card__weekday-bar">
                {dayLabels.map((d, i) => (
                    <span
                        key={i}
                        className={`clock-card__weekday-dot ${weekday === i + 1 ? 'clock-card__weekday-dot--active' : ''}`}
                    >
                        {d}
                    </span>
                ))}
            </div>

            {/* Status */}
            <div
                className="clock-card__status"
                style={{ '--status-color': status.color }}
            >
                <div className="clock-card__status-info">
                    <span className="clock-card__status-indicator">{status.icon} {status.label}</span>
                    <span className="clock-card__status-range">{status.range}</span>
                </div>
            </div>
        </div>
    );
});

function fmtHr(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

ClockCard.displayName = 'ClockCard';
export default ClockCard;
