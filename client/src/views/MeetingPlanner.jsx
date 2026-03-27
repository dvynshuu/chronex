import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { fetchWithAuth } from '../utils/api';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const [userIdToInvite, setUserIdToInvite] = useState(searchParams.get('invite'));
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
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Fetch from MongoDB and Organization on mount
    useEffect(() => {
        const initData = async () => {
            try {

                // Fetch participants
                const pRes = await fetchWithAuth('/api/v1/meetings');
                const pData = await pRes.json();
                if (pData.participants && pData.participants.length > 0) {
                    setParticipants(pData.participants);
                }
                if (pData.selectedSlot) {
                    setSelectedSlot(pData.selectedSlot);
                }

                // Fetch current user for "Add Me"
                const meRes = await fetchWithAuth('/api/v1/users/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setCurrentUser(meData);
                }

                // Fetch team members
                const tRes = await fetchWithAuth('/api/v1/orgs/me');
                if (tRes.ok) {
                    const tData = await tRes.json();
                    if (tData && tData.members) {
                        setTeam(tData.members);
                    }
                    // If we have an invite ID, and team is loaded, find and add
                    if (userIdToInvite) {
                        const memberToInvite = tData.members.find(m => m.id === userIdToInvite);
                        if (memberToInvite) {
                            addParticipant({
                                name: memberToInvite.name,
                                zone: memberToInvite.timezone || 'UTC',
                                workStart: memberToInvite.workSchedule?.workStart || 9,
                                workEnd: memberToInvite.workSchedule?.workEnd || 17
                            });
                            // Clear the param
                            setUserIdToInvite(null);
                            setSearchParams({});
                        }
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
                const res = await fetchWithAuth(`/api/v1/users/search?q=${encodeURIComponent(searchUser)}`);
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
                await fetchWithAuth('/api/v1/meetings/sync', {
                    method: 'POST',
                    body: JSON.stringify({ participants, selectedSlot })
                });
            } catch (err) {
                console.error('Sync failed:', err);
            }
        };

        const timer = setTimeout(syncWithDB, 500); // Debounce sync
        return () => clearTimeout(timer);
    }, [participants, selectedSlot, loading]);

    const overlapData = useMemo(() => computeOverlapData(participants), [participants]);

    const teamResults = useMemo(() => {
        if (!searchUser || searchUser.length < 1) return [];
        const search = searchUser.toLowerCase();
        return team.filter(member => 
            (member?.name?.toLowerCase().includes(search)) ||
            (member?.email?.toLowerCase().includes(search))
        ).slice(0, 5);
    }, [team, searchUser]);

    // Find best slots
    const bestSlots = useMemo(() => {
        const currentHour = DateTime.local().hour;
        return overlapData
            .filter(d => d.utcHour > currentHour && (d.status === 'perfect' || d.status === 'good'))
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

        setParticipants(prev => {
            if (prev.some(existingP => existingP.name === p.name)) {
                console.warn(`Participant with name "${p.name}" already exists.`);
                return prev;
            }
            return [...prev, p];
        });

        if (!pData) { // Only clear form if it's a manual add
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

    const addMe = () => {
        if (currentUser && !participants.some(p => p.name === currentUser.profile?.name)) {
            addParticipant({
                name: currentUser.profile?.name || currentUser.email,
                zone: currentUser.baseTimezone || 'UTC',
                workStart: currentUser.workSchedule?.workStart || 9,
                workEnd: currentUser.workSchedule?.workEnd || 17
            });
        }
    };

    return (
        <motion.div
            className="planner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <DashboardHeader 
                title="Meeting Planner" 
                welcomeMessage="GLOBAL COORDINATION ENGINE" 
                timeDisplay={DateTime.local().toFormat('hh:mm a')}
            />

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
                            {bestSlots.length > 0 ? bestSlots.map((slot, i) => {
                                const isSelected = selectedSlot?.utcHour === slot.utcHour;
                                return (
                                    <div 
                                        key={i} 
                                        className={`planner__slot-item planner__slot-item--${slot.status} ${isSelected ? 'planner__slot-item--selected' : ''}`}
                                    >
                                        <div className="planner__slot-info">
                                            <div className="planner__slot-time">{fmtHr(slot.utcHour)}</div>
                                            <small className="planner__slot-meta">
                                                {slot.workingCount}/{slot.totalParticipants} participants available
                                            </small>
                                        </div>
                                        <button 
                                            className={`primary-button ${isSelected ? 'primary-button--selected' : ''}`}
                                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                        >
                                            {isSelected ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                );
                            }) : (
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
                            {currentUser && (
                                <button className="planner__add-btn" onClick={addMe}>
                                    <span>👤</span> Add Me ({currentUser.profile?.name || 'Self'})
                                </button>
                            )}
                            {team.length > 0 && (
                                <button 
                                    className="planner__add-btn planner__add-btn--team" 
                                    onClick={() => {
                                        team.forEach(m => {
                                            if (!participants.some(p => p.name === m.name)) {
                                                addParticipant({
                                                    name: m.name,
                                                    zone: m.timezone || 'UTC',
                                                    workStart: m.workSchedule?.workStart || 9,
                                                    workEnd: m.workSchedule?.workEnd || 17
                                                });
                                            }
                                        });
                                    }}
                                >
                                    <span>👥</span> Add Team
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
                            {(teamResults.length > 0 || userResults.length > 0) && (
                                <motion.div 
                                    className="planner__user-results"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Team Results First */}
                                    {teamResults.map(user => (
                                        <button
                                            key={`team-${user.id || user.email}`}
                                            className="planner__user-result-item planner__user-result-item--team"
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
                                            <div className="planner__result-avatar planner__result-avatar--team">
                                                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                            </div>
                                            <div className="planner__result-info">
                                                <div className="planner__result-name">
                                                    {user.name || user.email || 'Unknown'} <small className="planner__team-badge">Team</small>
                                                </div>
                                                <div className="planner__result-meta">{user.email} • {user.timezone}</div>
                                            </div>
                                            <span className="planner__result-add">+</span>
                                        </button>
                                    ))}

                                    {/* Then User results (filter out duplicates if any) */}
                                    {userResults
                                        .filter(ur => !teamResults.some(tr => tr.id === ur.id || tr.email === ur.email))
                                        .map(user => (
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
                                            <div className="planner__result-avatar">
                                                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                            </div>
                                            <div className="planner__result-info">
                                                <div className="planner__result-name">{user.name || user.email || 'Unknown'}</div>
                                                <div className="planner__result-meta">{user.email} • {user.timezone}</div>
                                            </div>
                                            <span className="planner__result-add">+</span>
                                        </button>
                                    ))}
                                </motion.div>
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
                                    <motion.div 
                                        className="planner__zone-results"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
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
                                    </motion.div>
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
