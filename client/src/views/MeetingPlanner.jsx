import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import VisualHeatmap from '../components/VisualHeatmap/VisualHeatmap';
import OverlapSlider from '../components/OverlapSlider/OverlapSlider';
import { computeOverlapData } from '../hooks/useAvailability';
import './MeetingPlanner.css';

const MeetingPlanner = () => {
    const [participants, setParticipants] = useState([
        { name: 'Alice', zone: 'America/New_York', workStart: 9, workEnd: 17 },
        { name: 'Bob', zone: 'Europe/London', workStart: 9, workEnd: 18 },
        { name: 'Charlie', zone: 'Asia/Tokyo', workStart: 10, workEnd: 19 }
    ]);

    const [newName, setNewName] = useState('');
    const [newZone, setNewZone] = useState('');
    const [newWorkStart, setNewWorkStart] = useState(9);
    const [newWorkEnd, setNewWorkEnd] = useState(17);

    const overlapData = useMemo(() => computeOverlapData(participants), [participants]);

    // Find best slots
    const bestSlots = useMemo(() => {
        return overlapData
            .filter(d => d.status === 'perfect' || d.status === 'good')
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }, [overlapData]);

    const addParticipant = () => {
        if (!newName.trim() || !newZone.trim()) return;
        setParticipants(prev => [...prev, { name: newName.trim(), zone: newZone.trim(), workStart: newWorkStart, workEnd: newWorkEnd }]);
        setNewName('');
        setNewZone('');
        setNewWorkStart(9);
        setNewWorkEnd(17);
    };

    const removeParticipant = (idx) => {
        setParticipants(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <motion.div
            className="planner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="planner__title">Meeting Planner</h1>

            <div className="planner__grid">
                <div className="planner__main">
                    {/* Overlap Heatmap */}
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Overlap Intelligence</h5>
                        <p className="planner__card-subtitle">Green = all working, Red = no overlap</p>
                        <OverlapSlider participants={participants} />
                    </div>

                    {/* Visual Heatmap */}
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">24h Availability Matrix</h5>
                        <VisualHeatmap data={overlapData} />
                    </div>

                    {/* Best Slots */}
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Best Meeting Slots</h5>
                        <div className="planner__slots">
                            {bestSlots.length > 0 ? bestSlots.map((slot, i) => (
                                <div key={i} className={`planner__slot-item planner__slot-item--${slot.status}`}>
                                    <div className="planner__slot-info">
                                        <div className="planner__slot-time">{slot.utcHour}:00 UTC</div>
                                        <small className="planner__slot-meta">
                                            {slot.workingCount}/{slot.totalParticipants} participants available
                                        </small>
                                    </div>
                                    <button className="primary-button">Select</button>
                                </div>
                            )) : (
                                <p className="planner__no-slots">No ideal overlap found. Try adjusting work hours.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="planner__side">
                    {/* Participants */}
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Participants ({participants.length})</h5>
                        <div className="planner__participants">
                            {participants.map((p, i) => (
                                <div key={i} className="planner__participant-item">
                                    <div className="planner__participant-avatar"></div>
                                    <div className="planner__participant-info">
                                        <div className="planner__participant-name">{p.name}</div>
                                        <div className="planner__participant-zone">{p.zone}</div>
                                        <div className="planner__participant-hours">{p.workStart}:00 – {p.workEnd}:00</div>
                                    </div>
                                    <button className="planner__remove-btn" onClick={() => removeParticipant(i)} title="Remove">×</button>
                                </div>
                            ))}
                        </div>

                        {/* Add Participant Form */}
                        <div className="planner__add-form">
                            <input
                                type="text"
                                className="planner__input"
                                placeholder="Name"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <input
                                type="text"
                                className="planner__input"
                                placeholder="Timezone (e.g. US/Pacific)"
                                value={newZone}
                                onChange={e => setNewZone(e.target.value)}
                            />
                            <div className="planner__hours-row">
                                <label className="planner__hours-label">
                                    Start
                                    <input type="number" className="planner__input planner__input--small" min="0" max="23" value={newWorkStart} onChange={e => setNewWorkStart(+e.target.value)} />
                                </label>
                                <label className="planner__hours-label">
                                    End
                                    <input type="number" className="planner__input planner__input--small" min="0" max="23" value={newWorkEnd} onChange={e => setNewWorkEnd(+e.target.value)} />
                                </label>
                            </div>
                            <button className="primary-button planner__btn-add" onClick={addParticipant}>+ Add Participant</button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MeetingPlanner;
