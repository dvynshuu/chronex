import React, { useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import './OverlapSlider.css';

const OverlapSlider = ({ participants = [] }) => {
    const [selectedHour, setSelectedHour] = useState(null);

    const overlapData = useMemo(() => {
        const numParticipants = participants.length;
        if (numParticipants === 0) return Array.from({ length: 24 }, (_, h) => ({ hour: h, score: 0, status: 'avoid', workingCount: 0, details: [] }));

        const workingCounts = new Int32Array(24);
        const now = DateTime.local().startOf('day');

        // 1. O(N) pass to build the histogram
        participants.forEach(p => {
            const { zone, workStart = 9, workEnd = 17 } = p;
            let offset;
            try {
                offset = now.setZone(zone).offset / 60;
            } catch {
                offset = 0;
            }

            // Map local hours to UTC/Base hours
            for (let h = workStart; h < workEnd; h++) {
                const baseH = (h - Math.floor(offset) + 24) % 24;
                workingCounts[baseH]++;
            }
        });

        // 2. Build the lightweight matrix (no details yet)
        return Array.from({ length: 24 }, (_, h) => {
            const count = workingCounts[h];
            const score = count / numParticipants;
            let status;
            if (score === 1) status = 'perfect';
            else if (score >= 0.5) status = 'good';
            else if (score > 0) status = 'partial';
            else status = 'avoid';

            return { hour: h, score, status, workingCount: count };
        });
    }, [participants]);

    // 3. Lazy calculation of details for the selected hour only
    const selectedDetails = useMemo(() => {
        if (selectedHour === null || participants.length === 0) return [];
        
        const now = DateTime.local().startOf('day').plus({ hours: selectedHour });
        // For large teams, we might want to limit this to the first 50 or so
        const limit = 50; 
        
        return participants.slice(0, 100).map(p => {
            const { zone, workStart = 9, workEnd = 17, name } = p;
            let local;
            try {
                local = now.setZone(zone);
                if (!local.isValid) local = now;
            } catch { local = now; }

            const isWorking = local.hour >= workStart && local.hour < workEnd;
            return { name: name || zone, localTime: local.toFormat('hh:mm a'), isWorking };
        });
    }, [selectedHour, participants]);

    const selected = selectedHour !== null ? { ...overlapData[selectedHour], details: selectedDetails } : null;

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

import { fmtHr } from '../../utils/timeUtils';

export default OverlapSlider;
