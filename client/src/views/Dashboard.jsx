import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import ClockCard from '../components/ClockCard/ClockCard';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import TimeScrubber from '../components/TimeScrubber/TimeScrubber';
import './Dashboard.css';

const Dashboard = () => {
    const [baseTime, setBaseTime] = useState(DateTime.utc());
    const [favoriteZones] = useState([
        { city: 'New York', zone: 'America/New_York' },
        { city: 'London', zone: 'Europe/London' },
        { city: 'Tokyo', zone: 'Asia/Tokyo' }
    ]);

    const handleTimeChange = (hour) => {
        setBaseTime(prev => prev.set({ hour, minute: 0, second: 0 }));
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
                timeDisplay={baseTime.toFormat('HH:mm')}
            />

            <section className="dashboard__grid">
                {favoriteZones.map((z, idx) => (
                    <div key={idx} className="dashboard__card-item">
                        <ClockCard
                            city={z.city}
                            zone={z.zone}
                            utcTime={baseTime}
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
