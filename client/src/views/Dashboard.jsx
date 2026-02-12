import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import WorldClock from '../components/WorldClock';
import TimelineSlider from '../components/TimelineSlider';
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <header className="dash-header u-flex u-between u-center u-margin-b">
                <div>
                    <p className="u-dim u-m-0">Welcome back,</p>
                    <h1 className="u-bold u-m-0">Global Overview</h1>
                </div>
                <div className="dash-header-info u-glass" style={{ padding: '1rem 2rem' }}>
                    <p className="u-dim u-m-0" style={{ fontSize: '0.75rem' }}>CURRENT SCRUB TIME</p>
                    <h2 className="u-glow u-glow-pulse u-bold u-m-0">{baseTime.toFormat('HH:mm')}</h2>
                </div>
            </header>

            <section className="u-grid u-margin-b">
                {favoriteZones.map((z, idx) => (
                    <div key={idx} className="u-col-4">
                        <WorldClock
                            city={z.city}
                            zone={z.zone}
                            utcTime={baseTime}
                        />
                    </div>
                ))}
            </section>

            <section className="u-glass dash-scrubber-section">
                <div className="u-flex u-between u-center" style={{ marginBottom: '1rem' }}>
                    <div>
                        <h4 className="u-bold u-m-0">Timezone Scrubber</h4>
                        <p className="u-dim small u-m-0">Drag to compare times across regions.</p>
                    </div>
                    <div className="u-flex" style={{ gap: '1rem' }}>
                        <button className="u-btn u-btn-p small" style={{ padding: '0.5rem 1rem' }}>Create Meeting</button>
                        <button className="u-btn u-glass small" style={{ padding: '0.5rem 1rem' }}>Export</button>
                    </div>
                </div>

                <div className="dash-scrubber-content">
                    <TimelineSlider onTimeChange={handleTimeChange} baseTime={baseTime} />
                </div>
            </section>
        </motion.div>
    );
};

export default Dashboard;
