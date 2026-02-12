import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TimeScrubber.css';

const TimeScrubber = ({ onTimeChange, baseTime }) => {
    const [activeHour, setActiveHour] = useState(baseTime.hour);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const zones = [
        { city: 'New York', zone: 'America/New_York' },
        { city: 'London', zone: 'Europe/London' },
        { city: 'Tokyo', zone: 'Asia/Tokyo' }
    ];

    const handleDrag = (event, info) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = info.point.x - rect.left;
        const hour = Math.min(23, Math.max(0, Math.round((x / rect.width) * 23)));

        if (hour !== activeHour) {
            setActiveHour(hour);
            onTimeChange(hour);
        }
    };

    return (
        <div
            className="time-scrubber"
            ref={containerRef}
            style={{
                '--scrubber-progress': `${(activeHour / 23) * 100}%`
            }}
        >
            <div className="time-scrubber__track">
                <div className="time-scrubber__highlight time-scrubber__highlight--work"></div>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                onDrag={handleDrag}
                className="time-scrubber__handle"
            >
                <div className="time-scrubber__knob">
                    <AnimatePresence>
                        {isDragging && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: -90, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="time-scrubber__tooltip"
                            >
                                {zones.map(z => (
                                    <div key={z.city} className="time-scrubber__tooltip-row">
                                        <span className="time-scrubber__tooltip-city">{z.city}</span>
                                        <span className="time-scrubber__tooltip-time">
                                            {baseTime.setZone(z.zone).toFormat('hh:mm a')}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <div className="time-scrubber__labels">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
            </div>
        </div>
    );
};

export default TimeScrubber;
