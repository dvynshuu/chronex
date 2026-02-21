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
                            title={`${fmtHr(h.utcHour ?? h.hour)} — ${h.status}${h.workingCount !== undefined ? ` (${h.workingCount}/${h.totalParticipants})` : ''}`}
                        >
                            <span className="visual-heatmap__bar-fill"></span>
                        </div>
                    );
                })}
            </div>
            <div className="visual-heatmap__labels">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
            </div>
        </div>
    );
};

function fmtHr(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display} ${ampm}`;
}

export default VisualHeatmap;
