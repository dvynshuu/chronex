import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import useAnimationClock from '../hooks/useAnimationClock';
import ClockCard from '../components/ClockCard/ClockCard';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import TimeScrubber from '../components/TimeScrubber/TimeScrubber';
import './Dashboard.css';

const Dashboard = () => {
    const liveClock = useAnimationClock(1000);
    const [scrubOffset, setScrubOffset] = useState(null); // total minutes offset from start of day
    const [favoriteZones, setFavoriteZones] = useState([
        { city: 'New York', zone: 'America/New_York', workStart: 9, workEnd: 17 },
        { city: 'London', zone: 'Europe/London', workStart: 9, workEnd: 18 },
        { city: 'Tokyo', zone: 'Asia/Tokyo', workStart: 10, workEnd: 19 }
    ]);

    const [draggedIndex, setDraggedIndex] = useState(null);

    const baseTime = scrubOffset !== null
        ? liveClock.startOf('day').plus({ minutes: scrubOffset })
        : liveClock;

    const handleTimeChange = useCallback((totalMinutes) => {
        setScrubOffset(totalMinutes);
    }, []);

    // Detect user's local timezone for "isLocal" flag
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // --- Drag to Reorder ---
    const handleDragStart = (e, idx) => {
        setDraggedIndex(idx);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === idx) return;

        const updated = [...favoriteZones];
        const [dragged] = updated.splice(draggedIndex, 1);
        updated.splice(idx, 0, dragged);
        setDraggedIndex(idx);
        setFavoriteZones(updated);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <DashboardHeader
                title="Global Overview"
                welcomeMessage="Welcome back,"
                timeDisplay={baseTime.toFormat('HH:mm:ss')}
            />

            <section className="dashboard__grid">
                {favoriteZones.map((z, idx) => (
                    <div
                        key={z.zone}
                        className={`dashboard__card-item ${draggedIndex === idx ? 'dashboard__card-item--dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                    >
                        <ClockCard
                            city={z.city}
                            zone={z.zone}
                            utcTime={baseTime}
                            workStart={z.workStart}
                            workEnd={z.workEnd}
                            isLocal={z.zone === localZone}
                        />
                    </div>
                ))}
            </section>

            <section className="dashboard__scrubber-section glass-panel">
                <div className="dashboard__scrubber-header">
                    <div className="dashboard__scrubber-info">
                        <h4 className="dashboard__scrubber-title">Timezone Scrubber</h4>
                        <p className="dashboard__scrubber-desc">Drag to compare times across regions.</p>
                    </div>
                    <div className="dashboard__scrubber-actions">
                        <button className="primary-button">Create Meeting</button>
                        <button className="dashboard__btn-secondary">Export</button>
                    </div>
                </div>

                <div className="dashboard__scrubber-content">
                    <TimeScrubber onTimeChange={handleTimeChange} baseTime={baseTime} />
                </div>
            </section>
        </motion.div>
    );
};

export default Dashboard;
