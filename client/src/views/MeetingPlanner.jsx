import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VisualHeatmap from '../components/VisualHeatmap';
import './MeetingPlanner.css';
import './TeamDashboard.css'; // For shared insight-box style

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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="u-bold u-margin-b">Meeting Planner</h1>

            <div className="u-grid">
                <div className="u-col-8">
                    <div className="u-glass u-margin-b">
                        <h5 className="u-bold u-margin-b">Optimal Overlap Finder</h5>
                        <VisualHeatmap data={heatmapData} />
                        <div className="insight-box">
                            <p className="u-dim u-m-0">
                                💡 <strong>Insight:</strong> The best time for this group is **14:00 - 15:00 UTC**.
                            </p>
                        </div>
                    </div>

                    <div className="u-glass">
                        <h5 className="u-bold u-margin-b">Suggested Slots</h5>
                        <div className="slot-list">
                            {[14, 15, 13].map(h => (
                                <div key={h} className="slot-item">
                                    <div>
                                        <div className="u-bold">{h}:00 UTC</div>
                                        <small className="u-dim">All participants active</small>
                                    </div>
                                    <button className="u-btn u-btn-p">Select</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="u-col-4">
                    <div className="u-glass">
                        <h5 className="u-bold u-margin-b">Participants</h5>
                        <div className="planner-participants">
                            {participants.map((p, i) => (
                                <div key={i} className="participant-item">
                                    <div className="participant-avatar"></div>
                                    <div>
                                        <div className="u-bold">{p.name}</div>
                                        <div className="u-dim" style={{ fontSize: '0.75rem' }}>{p.zone}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-add-participant">+ Add Participant</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MeetingPlanner;
