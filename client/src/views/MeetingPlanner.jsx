import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import VisualHeatmap from '../components/VisualHeatmap/VisualHeatmap';
import OverlapSlider from '../components/OverlapSlider/OverlapSlider';
import { computeOverlapData } from '../hooks/useAvailability';
import './MeetingPlanner.css';

const CITY_DATABASE = [
    { city: 'London', zone: 'Europe/London', country: 'UK' },
    { city: 'New York', zone: 'America/New_York', country: 'USA' },
    { city: 'Tokyo', zone: 'Asia/Tokyo', country: 'Japan' },
    { city: 'Singapore', zone: 'Asia/Singapore', country: 'Singapore' },
    { city: 'Dubai', zone: 'Asia/Dubai', country: 'UAE' },
    { city: 'Paris', zone: 'Europe/Paris', country: 'France' },
    { city: 'Berlin', zone: 'Europe/Berlin', country: 'Germany' },
    { city: 'Mumbai', zone: 'Asia/Kolkata', country: 'India' },
    { city: 'Sydney', zone: 'Australia/Sydney', country: 'Australia' },
    { city: 'San Francisco', zone: 'America/Los_Angeles', country: 'USA' },
    { city: 'Los Angeles', zone: 'America/Los_Angeles', country: 'USA' },
    { city: 'Chicago', zone: 'America/Chicago', country: 'USA' },
    { city: 'Hong Kong', zone: 'Asia/Hong_Kong', country: 'China' },
    { city: 'Seoul', zone: 'Asia/Seoul', country: 'South Korea' }
];

const MeetingPlanner = () => {
    const [participants, setParticipants] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newName, setNewName] = useState('');
    const [newZone, setNewZone] = useState('');
    const [searchZone, setSearchZone] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [newWorkStart, setNewWorkStart] = useState(9);
    const [newWorkEnd, setNewWorkEnd] = useState(17);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch from MongoDB and Organization on mount
    useEffect(() => {
        const initData = async () => {
            try {
                // Fetch participants
                const pRes = await fetch('/api/v1/meetings');
                const pData = await pRes.json();
                if (pData.participants && pData.participants.length > 0) {
                    setParticipants(pData.participants);
                }

                // Fetch current user for "Add Me"
                const meRes = await fetch('/api/v1/users/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setCurrentUser(meData);
                }

                // Fetch team members
                const tRes = await fetch('/api/v1/orgs/me');
                if (tRes.ok) {
                    const tData = await tRes.json();
                    if (tData && tData.members) {
                        setTeam(tData.members);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    // User Search Logic
    useEffect(() => {
        if (!searchUser || searchUser.length < 2) {
            setUserResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(searchUser)}`);
                const data = await res.json();
                setUserResults(data);
            } catch (err) {
                console.error('User search failed:', err);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchUser]);

    // Sync with MongoDB whenever participants change
    useEffect(() => {
        if (loading) return;

        const syncWithDB = async () => {
            try {
                await fetch('/api/v1/meetings/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participants })
                });
            } catch (err) {
                console.error('Sync failed:', err);
            }
        };

        const timer = setTimeout(syncWithDB, 500); // Debounce sync
        return () => clearTimeout(timer);
    }, [participants, loading]);

    const overlapData = useMemo(() => computeOverlapData(participants), [participants]);

    // Find best slots
    const bestSlots = useMemo(() => {
        return overlapData
            .filter(d => d.status === 'perfect' || d.status === 'good')
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }, [overlapData]);

    const filteredZones = useMemo(() => {
        if (!searchZone) return [];
        return CITY_DATABASE.filter(c =>
            c.city.toLowerCase().includes(searchZone.toLowerCase()) ||
            c.country.toLowerCase().includes(searchZone.toLowerCase())
        ).slice(0, 5);
    }, [searchZone]);

    const addParticipant = (pData) => {
        const p = pData || { name: newName.trim(), zone: newZone.trim(), workStart: newWorkStart, workEnd: newWorkEnd };
        if (!p.name || !p.zone) return;

        setParticipants(prev => [...prev, p]);

        if (!pData) {
            setNewName('');
            setNewZone('');
            setSearchZone('');
            setNewWorkStart(9);
            setNewWorkEnd(17);
        }
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
                                        <div className="planner__slot-time">{fmtHr(slot.utcHour)}</div>
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
                    {/* Real User Discovery */}
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Discover Participants</h5>

                        <div className="planner__discovery-actions">
                            {currentUser && !participants.some(p => p.name === currentUser.profile?.name) && (
                                <button
                                    className="planner__add-me-btn"
                                    onClick={() => addParticipant({
                                        name: currentUser.profile?.name || currentUser.email,
                                        zone: currentUser.baseTimezone || 'UTC',
                                        workStart: currentUser.workSchedule?.workStart || 9,
                                        workEnd: currentUser.workSchedule?.workEnd || 17
                                    })}
                                >
                                    <span>👤</span> Add Me ({currentUser.profile?.name || 'Self'})
                                </button>
                            )}
                        </div>

                        <div className="planner__user-search">
                            <input
                                type="text"
                                className="planner__input"
                                placeholder="Search real users by name or email..."
                                value={searchUser}
                                onChange={e => {
                                    setSearchUser(e.target.value);
                                    setIsSearchingUser(true);
                                }}
                                onFocus={() => setIsSearchingUser(true)}
                            />
                            {isSearchingUser && userResults.length > 0 && (
                                <div className="planner__user-results">
                                    {userResults.map(user => (
                                        <button
                                            key={user.id}
                                            className="planner__user-result-item"
                                            onClick={() => {
                                                addParticipant({
                                                    name: user.name,
                                                    zone: user.timezone || 'UTC',
                                                    workStart: user.workSchedule?.workStart || 9,
                                                    workEnd: user.workSchedule?.workEnd || 17
                                                });
                                                setSearchUser('');
                                                setIsSearchingUser(false);
                                            }}
                                            disabled={participants.some(p => p.name === user.name)}
                                        >
                                            <div className="planner__result-avatar">{user.name.charAt(0)}</div>
                                            <div className="planner__result-info">
                                                <div className="planner__result-name">{user.name}</div>
                                                <div className="planner__result-meta">{user.email} • {user.timezone}</div>
                                            </div>
                                            <span className="planner__result-add">+</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {isSearchingUser && searchUser.length >= 2 && userResults.length === 0 && (
                                <div className="planner__search-empty">No results for "{searchUser}"</div>
                            )}
                        </div>
                    </div>

                    {/* Participants List */}
                    <div className="planner__card glass-panel">
                        <h5 className="planner__card-title">Participants ({participants.length})</h5>
                        <div className="planner__participants">
                            {participants.map((p, i) => (
                                <div key={i} className="planner__participant-item">
                                    <div className="planner__participant-avatar">{p.name.charAt(0)}</div>
                                    <div className="planner__participant-info">
                                        <div className="planner__participant-name">{p.name}</div>
                                        <div className="planner__participant-zone">{p.zone}</div>
                                        <div className="planner__participant-hours">{fmtHr(p.workStart)} – {fmtHr(p.workEnd)}</div>
                                    </div>
                                    <button className="planner__remove-btn" onClick={() => removeParticipant(i)} title="Remove">×</button>
                                </div>
                            ))}
                        </div>

                        {/* Add Participant Form */}
                        <div className="planner__add-form">
                            <h6 className="planner__form-label">Add Guest</h6>
                            <input
                                type="text"
                                className="planner__input"
                                placeholder="Name"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />

                            <div className="planner__zone-search">
                                <input
                                    type="text"
                                    className="planner__input"
                                    placeholder="Search timezone (e.g. India, USA...)"
                                    value={searchZone}
                                    onChange={e => {
                                        setSearchZone(e.target.value);
                                        setIsSearching(true);
                                    }}
                                    onFocus={() => setIsSearching(true)}
                                />
                                {isSearching && filteredZones.length > 0 && (
                                    <div className="planner__zone-results">
                                        {filteredZones.map((z, idx) => (
                                            <button
                                                key={idx}
                                                className="planner__zone-result-item"
                                                onClick={() => {
                                                    setNewZone(z.zone);
                                                    setSearchZone(`${z.city} (${z.zone})`);
                                                    setIsSearching(false);
                                                }}
                                            >
                                                <strong>{z.city}</strong>, {z.country} <small>{z.zone}</small>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="planner__hours-row">
                                <label className="planner__hours-label">
                                    Start (0-23)
                                    <input type="number" className="planner__input" min="0" max="23" value={newWorkStart} onChange={e => setNewWorkStart(+e.target.value)} />
                                </label>
                                <label className="planner__hours-label">
                                    End (0-23)
                                    <input type="number" className="planner__input" min="0" max="23" value={newWorkEnd} onChange={e => setNewWorkEnd(+e.target.value)} />
                                </label>
                            </div>
                            <button
                                className="primary-button planner__btn-submit"
                                onClick={() => addParticipant()}
                                disabled={!newName || !newZone}
                            >
                                + Add to Meeting
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

import { fmtHr } from '../utils/timeUtils';

export default MeetingPlanner;
