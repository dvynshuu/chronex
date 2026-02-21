import React from 'react';
import './VisualHeatmap.css';

const VisualHeatmap = ({ data }) => {
    return (
        <div className="visual-heatmap">
            <div className="visual-heatmap__tracks">
                {data.map((h, i) => {
                    const status = (typeof h.status === 'string') ? h.status.toLowerCase().replace(' ', '-') : 'avoid';
                    const height = typeof h.score === 'number' && typeof h.maxScore === 'number'
                        ? `${Math.max((h.score / h.maxScore) * 100, 6)}%`
                        : '6%';

                    return (
                        <div
                            key={i}
                            className={`visual-heatmap__bar visual-heatmap__bar--${status}`}
                            style={{ '--bar-height': height }}
                            title={`${h.utcHour ?? h.hour}:00 — ${h.status}${h.workingCount !== undefined ? ` (${h.workingCount}/${h.totalParticipants})` : ''}`}
                        >
                            <span className="visual-heatmap__bar-fill"></span>
                        </div>
                    );
                })}
            </div>
            <div className="visual-heatmap__labels">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
            </div>
        </div>
    );
};

export default VisualHeatmap;
