import React from 'react';
import './VisualHeatmap.css';

const VisualHeatmap = ({ data }) => {
    return (
        <div className="visual-heatmap">
            <div className="visual-heatmap__tracks">
                {data.map((h, i) => (
                    <div
                        key={i}
                        className="visual-heatmap__bar"
                        style={{
                            '--bar-height': `${(h.score / h.maxScore) * 100}%`,
                            '--bar-color': `var(--status-${h.status.toLowerCase().replace(' ', '-')})`
                        }}
                        title={`${h.hour}:00 - ${h.status}`}
                    ></div>
                ))}
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
