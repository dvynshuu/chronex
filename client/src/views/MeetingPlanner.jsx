import { useState } from 'react';
import { motion } from 'framer-motion';
import VisualHeatmap from '../components/VisualHeatmap/VisualHeatmap';
import './MeetingPlanner.css';

const MeetingPlanner = () => {
    const [participants] = useState([
        { name: 'Alice', zone: 'America/New_York' },
        { name: 'Bob', zone: 'Europe/London' },
        { name: 'Charlie', zone: 'Asia/Tokyo' }
    ]);

    const heatmapData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        score: i > 9 && i < 17 ? 3 : (i > 7 && i < 22 ? 1.5 : 0.5),
        maxScore: 3,
        status: i > 13 && i < 16 ? 'Perfect' : (i > 8 && i < 20 ? 'Good' : 'Avoid')
    }));

    return (
        <motion.div
            className="planner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="planner__title">Meeting Planner</h1>

            <div className="planner__grid">
                <div className="planner__main">
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Optimal Overlap Finder</h5>
                        <VisualHeatmap data={heatmapData} />
                        <div className="planner__insight">
                            <p className="planner__insight-text">
                                💡 <strong>Insight:</strong> The best time for this group is **14:00 - 15:00 UTC**.
                            </p>
                        </div>
                    </div>

                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Suggested Slots</h5>
                        <div className="planner__slots">
                            {[14, 15, 13].map(h => (
                                <div key={h} className="planner__slot-item">
                                    <div className="planner__slot-info">
                                        <div className="planner__slot-time">{h}:00 UTC</div>
                                        <small className="planner__slot-meta">All participants active</small>
                                    </div>
                                    <button className="primary-button">Select</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="planner__side">
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Participants</h5>
                        <div className="planner__participants">
                            {participants.map((p, i) => (
                                <div key={i} className="planner__participant-item">
                                    <div className="planner__participant-avatar"></div>
                                    <div className="planner__participant-info">
                                        <div className="planner__participant-name">{p.name}</div>
                                        <div className="planner__participant-zone">{p.zone}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="planner__btn-add">+ Add Participant</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MeetingPlanner;
