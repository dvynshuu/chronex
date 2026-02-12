import React from 'react';
import { motion } from 'framer-motion';
import { getTimeContext } from '../utils/timeContext';
import './WorldClock.css';

const WorldClock = ({ city, zone, utcTime }) => {
    const localTime = utcTime.setZone(zone);
    const context = getTimeContext(localTime);

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="u-glass clock-card"
        >
            <div className="clock-info">
                <div>
                    <h5 className="u-bold u-m-0">{city}</h5>
                    <div className="clock-offset">{localTime.offsetNameShort} ({localTime.toFormat('ZZ')})</div>
                </div>
                {localTime.isInDST && (
                    <span className="u-pill u-pill-p">DST</span>
                )}
            </div>

            <div className="clock-time">
                <h1 className="u-glow u-bold u-m-0">
                    {localTime.toFormat('HH:mm')}
                </h1>
                <p className="clock-date">{localTime.toFormat('EEE, MMM dd')}</p>
            </div>

            <div className="clock-context" style={{ borderTop: `2px solid ${context.color}` }}>
                <span className="context-indicator">{context.icon} {context.label}</span>
                <span className="context-range u-dim">{context.range}</span>
            </div>

            <div className="clock-actions">
                <button className="clock-btn small">Schedule</button>
                <button className="clock-btn small icon-only">⭐</button>
            </div>
        </motion.div>
    );
};

export default WorldClock;
