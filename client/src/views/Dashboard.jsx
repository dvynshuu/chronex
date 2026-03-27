import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '../utils/api';
import useAnimationClock from '../hooks/useAnimationClock';
import ClockCard from '../components/ClockCard/ClockCard';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import TimeScrubber from '../components/TimeScrubber/TimeScrubber';
import './Dashboard.css';

import AddCityModal from '../components/Dashboard/AddCityModal';

const Dashboard = () => {
    const liveClock = useAnimationClock(1000);
    const [scrubOffset, setScrubOffset] = useState(null); // total minutes offset from start of day
    const [favoriteZones, setFavoriteZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Fetch favorites from MongoDB on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetchWithAuth('/api/v1/users/me');
                const data = await res.json();

                if (data.favorites && data.favorites.length > 0) {
                    setFavoriteZones(data.favorites);
                } else {
                    // Seed defaults if empty
                    const defaults = [
                        { city: 'New York', zone: 'America/New_York', workStart: 9, workEnd: 17 },
                        { city: 'London', zone: 'Europe/London', workStart: 9, workEnd: 18 },
                        { city: 'Tokyo', zone: 'Asia/Tokyo', workStart: 10, workEnd: 19 }
                    ];
                    setFavoriteZones(defaults);

                    // Sync defaults to DB so they persist
                    await fetchWithAuth('/api/v1/users/me/favorites', {
                        method: 'PUT',
                        body: JSON.stringify({ favorites: defaults })
                    });
                }
            } catch (err) {
                console.error('Failed to fetch user data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    // Helper to sync reordered/updated list to DB
    const syncFavorites = async (updatedList) => {
        try {
            await fetchWithAuth('/api/v1/users/me/favorites', {
                method: 'PUT',
                body: JSON.stringify({ favorites: updatedList })
            });
        } catch (err) {
            console.error('Failed to sync favorites:', err);
        }
    };

    const handleAddCity = (newCity) => {
        const updated = [...favoriteZones, newCity];
        setFavoriteZones(updated);
        syncFavorites(updated);
    };

    const handleRemoveCity = (idx) => {
        const updated = favoriteZones.filter((_, i) => i !== idx);
        setFavoriteZones(updated);
        syncFavorites(updated);
    };

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
        syncFavorites(favoriteZones); // Persist order to DB
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
                timeDisplay={baseTime.toFormat('hh:mm:ss a')}
            />

            <section className="dashboard__grid">
                {favoriteZones.map((z, idx) => (
                    <div
                        key={`${z.zone}-${idx}`}
                        className={`dashboard__card-item ${draggedIndex === idx ? 'dashboard__card-item--dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                    >
                        <ClockCard
                            city={z.city}
                            zone={z.zone}
                            baseTime={baseTime}
                            workStart={z.workStart}
                            workEnd={z.workEnd}
                            isLocal={z.zone === localZone}
                            onRemove={() => handleRemoveCity(idx)}
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
                        <button className="primary-button" onClick={() => setShowAddModal(true)}>Add City</button>
                    </div>
                </div>

                <div className="dashboard__scrubber-content">
                    <TimeScrubber onTimeChange={handleTimeChange} baseTime={baseTime} />
                </div>
            </section>

            <AddCityModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddCity}
            />
        </motion.div>
    );
};

export default Dashboard;
