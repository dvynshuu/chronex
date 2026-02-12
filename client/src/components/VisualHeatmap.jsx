import React from 'react';
import './VisualHeatmap.css';

const VisualHeatmap = ({ data }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Perfect': return 'var(--clr-ok)';
            case 'Good': return 'var(--clr-warn)';
            case 'Avoid': return 'var(--clr-err)';
            default: return 'var(--bg-panel)';
        }
    };

    return (
        <div className="heatmap-container">
            {data.map((h, i) => (
                <div
                    key={i}
                    className="heatmap-bar"
                    style={{
                        height: `${(h.score / h.maxScore) * 100}%`,
                        backgroundColor: getStatusColor(h.status)
                    }}
                    title={`${h.hour}:00 - ${h.status}`}
                ></div>
            ))}
        </div>
    );
};

export default VisualHeatmap;
