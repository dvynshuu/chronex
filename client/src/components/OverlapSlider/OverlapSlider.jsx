import React, { useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import './OverlapSlider.css';

const OverlapSlider = ({ participants = [] }) => {
    const [selectedHour, setSelectedHour] = useState(null);

    const overlapData = useMemo(() => {
        const now = DateTime.local().startOf('day');
        return Array.from({ length: 24 }, (_, h) => {
            const utcHour = now.plus({ hours: h });
            let workingCount = 0;
            const details = [];

            participants.forEach(p => {
                const { zone, workStart = 9, workEnd = 17, name } = p;
                let local;
                try {
                    local = utcHour.setZone(zone);
                    if (!local.isValid) local = utcHour;
                } catch { local = utcHour; }

                const localHour = local.hour;
                const isWorking = localHour >= workStart && localHour < workEnd;
                if (isWorking) workingCount++;
                details.push({ name: name || zone, localTime: local.toFormat('hh:mm a'), isWorking });
            });

            const score = participants.length > 0 ? workingCount / participants.length : 0;
            let status;
            if (score === 1) status = 'perfect';
            else if (score >= 0.5) status = 'good';
            else if (score > 0) status = 'partial';
            else status = 'avoid';

            return { hour: h, score, status, workingCount, details };
        });
    }, [participants]);

    const selected = selectedHour !== null ? overlapData[selectedHour] : null;

    return (
        <div className="overlap-slider">
            <div className="overlap-slider__track">
                {overlapData.map((d, i) => (
                    <button
                        key={i}
                        className={`overlap-slider__bar overlap-slider__bar--${d.status} ${selectedHour === i ? 'overlap-slider__bar--selected' : ''}`}
                        style={{ '--bar-height': `${Math.max(d.score * 100, 8)}%` }}
                        onClick={() => setSelectedHour(i === selectedHour ? null : i)}
                        title={`${fmtHr(i)} — ${d.status}`}
                    >
                        <span className="overlap-slider__bar-fill"></span>
                    </button>
                ))}
            </div>
            <div className="overlap-slider__labels">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
            </div>

            {/* Legend */}
            <div className="overlap-slider__legend">
                <span className="overlap-slider__legend-item overlap-slider__legend-item--perfect">All available</span>
                <span className="overlap-slider__legend-item overlap-slider__legend-item--good">Most available</span>
                <span className="overlap-slider__legend-item overlap-slider__legend-item--partial">Some available</span>
                <span className="overlap-slider__legend-item overlap-slider__legend-item--avoid">No overlap</span>
            </div>

            {/* Detail tooltip */}
            {selected && (
                <div className="overlap-slider__detail glass-panel">
                    <div className="overlap-slider__detail-header">
                        <strong>{fmtHr(selected.hour)}</strong>
                        <span className={`overlap-slider__detail-badge overlap-slider__detail-badge--${selected.status}`}>
                            {selected.workingCount}/{participants.length} available
                        </span>
                    </div>
                    <div className="overlap-slider__detail-list">
                        {selected.details.map((d, i) => (
                            <div key={i} className="overlap-slider__detail-row">
                                <span className={`overlap-slider__dot ${d.isWorking ? 'overlap-slider__dot--working' : ''}`}></span>
                                <span className="overlap-slider__detail-name">{d.name}</span>
                                <span className="overlap-slider__detail-time">{d.localTime}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function fmtHr(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

export default OverlapSlider;
