import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import './TimeScrubber.css';

/**
 * Enterprise-grade Timezone Scrubber
 * High-precision, interaction-focused, performance-optimized.
 */
const TimeScrubber = ({ onTimeChange, baseTime }) => {
    // Current minutes (0-1439)
    const [minutes, setMinutes] = useState(() => (baseTime.hour * 60) + baseTime.minute);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Refs for interaction state to avoid jitter and excessive re-renders
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const frameRef = useRef(null);
    const lastMinutesRef = useRef(minutes);

    // Dynamic snap interval based on keyboard modifiers
    const getInterval = (e) => {
        if (e?.altKey) return 1;    // High precision
        if (e?.shiftKey) return 15; // Coarse precision
        return 5;                   // Default
    };

    /**
     * Maps a horizontal pixel position inside the track to minutes (0-1439).
     * Handles clamping and snapping logic.
     */
    const calculateMinutes = useCallback((clientX, rect, interval) => {
        if (!rect) return 0;

        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width)); // Clamp to bounds

        const rawMinutes = (x / rect.width) * 1439;
        const snapped = Math.round(rawMinutes / interval) * interval;

        return Math.min(1439, Math.max(0, snapped));
    }, []);

    const updateTime = useCallback((newMinutes) => {
        if (newMinutes === lastMinutesRef.current) return;

        lastMinutesRef.current = newMinutes;
        setMinutes(newMinutes);

        // Notify parent. Since our parent expect 'hour' in previous version, 
        // we'll update this once Dashboard is adjusted, or provide the hour for now.
        // For Chronex v2, we want precision, so we'll pass minutes or a DateTime.
        if (onTimeChange) {
            onTimeChange(newMinutes);
        }
    }, [onTimeChange]);

    // --- Drag Logic ---
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !trackRef.current) return;

        // Use requestAnimationFrame for 60fps interaction smoothness
        if (frameRef.current) cancelAnimationFrame(frameRef.current);

        frameRef.current = requestAnimationFrame(() => {
            const rect = trackRef.current.getBoundingClientRect();
            const interval = getInterval(e);
            const m = calculateMinutes(e.clientX, rect, interval);
            updateTime(m);
        });
    }, [isDragging, calculateMinutes, updateTime]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        // Immediate jump on click
        const rect = trackRef.current.getBoundingClientRect();
        const interval = getInterval(e);
        const m = calculateMinutes(e.clientX, rect, interval);
        updateTime(m);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // --- Keyboard Logic ---
    const handleKeyDown = (e) => {
        let delta = 0;
        const interval = getInterval(e);

        if (e.key === 'ArrowRight') delta = interval;
        else if (e.key === 'ArrowLeft') delta = -interval;
        else return;

        e.preventDefault();
        const next = Math.max(0, Math.min(1439, minutes + delta));
        updateTime(next);
    };

    // --- Visual Ticks ---
    const ticks = useMemo(() => {
        const t = [];
        // Generate ticks every 15 minutes (96 total)
        for (let i = 0; i <= 1440; i += 15) {
            const isMajor = i % 360 === 0;    // 6 hours
            const isMedium = i % 60 === 0;   // 1 hour
            const position = (i / 1440) * 100;

            t.push({
                minutes: i,
                position,
                type: isMajor ? 'major' : isMedium ? 'medium' : 'minor',
                label: isMajor ? DateTime.fromMillis(0).startOf('day').plus({ minutes: i }).toFormat('h a') : null
            });
        }
        return t;
    }, []);

    // Tooltip formatting
    const displayTime = useMemo(() => {
        return DateTime.fromMillis(0).startOf('day').plus({ minutes }).toFormat('hh:mm a');
    }, [minutes]);

    // Sync from props (external change)
    useEffect(() => {
        const target = (baseTime.hour * 60) + baseTime.minute;
        if (!isDragging && target !== lastMinutesRef.current) {
            setMinutes(target);
            lastMinutesRef.current = target;
        }
    }, [baseTime, isDragging]);

    const progressPercent = (minutes / 1439) * 100;

    return (
        <div
            className={`scrubber-container ${isDragging ? 'scrubber--dragging' : ''}`}
            onKeyDown={handleKeyDown}
            tabIndex="0"
            role="slider"
            aria-valuemin="0"
            aria-valuemax="1439"
            aria-valuenow={minutes}
            aria-valuetext={displayTime}
            aria-label="Time Scrubber"
        >
            <div
                className="scrubber-track-area"
                onMouseDown={handleMouseDown}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                ref={trackRef}
            >
                {/* Visual Track */}
                <div className="scrubber-track">
                    {/* Tick scale */}
                    <div className="scrubber-ticks">
                        {ticks.map(tick => (
                            <div
                                key={tick.minutes}
                                className={`scrubber-tick scrubber-tick--${tick.type}`}
                                style={{ left: `${tick.position}%` }}
                            >
                                {tick.label && <span className="scrubber-tick-label">{tick.label}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Progress Fill */}
                    <div
                        className="scrubber-progress"
                        style={{ width: `${progressPercent}%` }}
                    />

                    {/* Handle */}
                    <div
                        className="scrubber-handle"
                        style={{ left: `${progressPercent}%` }}
                    >
                        <div className="scrubber-handle-glow" />

                        {/* Tooltip */}
                        <div className={`scrubber-tooltip ${(isDragging || isHovering) ? 'scrubber-tooltip--visible' : ''}`}>
                            <div className="scrubber-tooltip-time">{displayTime}</div>
                            <div className="scrubber-tooltip-day">{baseTime.toFormat('EEE, MMM dd')}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hint labels */}
            <div className="scrubber-hints">
                <span>Hold <b>ALT</b> for 1m precision</span>
                <span>Hold <b>SHIFT</b> for 15m snapping</span>
            </div>
        </div>
    );
};

export default TimeScrubber;
