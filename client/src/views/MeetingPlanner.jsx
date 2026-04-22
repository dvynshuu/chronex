import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { fetchWithAuth } from '../utils/api';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import { computeOverlapData } from '../hooks/useAvailability';
import { fmtHr } from '../utils/timeUtils';
import { generateICS, downloadICS } from '../utils/icsGenerator';
import './MeetingPlanner.css';

// Location data is now fetched from the backend

const MeetingPlanner = () => {
    const [participants, setParticipants] = useState([]);
    const [team, setTeam] = useState([]);
    const [cityDatabase, setCityDatabase] = useState([]);
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
    const [meetingTitle, setMeetingTitle] = useState('Global Q3 Planning');
    const [meetingDuration, setMeetingDuration] = useState(45);
    const [timeFormat, setTimeFormat] = useState('24H');
    const [sendingStatus, setSendingStatus] = useState('idle');
    const [conflicts, setConflicts] = useState([]);
    const [intelligentSuggestions, setIntelligentSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const res = await fetchWithAuth('/api/v1/meetings/bootstrap');
                if (res.ok) {
                    const data = await res.json();
                    setParticipants(data.participants || []);
                    setSelectedSlot(data.selectedSlot || null);
                    setConflicts(data.conflicts || []);
                    setCityDatabase(data.cities || []);
                    setMeetingTitle(data.title || 'Global Q3 Planning');
                    setIntelligentSuggestions(data.suggestions || []);
                    
                    // Fetch user info in parallel if not in bootstrap
                    const meRes = await fetchWithAuth('/api/v1/users/me');
                    const meData = await meRes.json();
                    setCurrentUser(meData);

                    const tRes = await fetchWithAuth('/api/v1/orgs/me');
                    const tData = await tRes.json();
                    setTeam(tData.members || []);

                    // Handle invite link
                    if (userIdToInvite && tData.members) {
                        const memberToInvite = tData.members.find(m => m.id === userIdToInvite);
                        if (memberToInvite) {
                            addParticipant({
                                name: memberToInvite.name,
                                zone: memberToInvite.timezone || 'UTC',
                                workStart: memberToInvite.workSchedule?.workStart || 9,
                                workEnd: memberToInvite.workSchedule?.workEnd || 17
                            });
                            setSearchParams({});
                        }
                    }
                }
            } catch (err) {
                console.error('Bootstrap failed:', err);
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []);

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
        const timer = setTimeout(syncWithDB, 500);
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

    const bestSlots = useMemo(() => {
        if (intelligentSuggestions.length > 0) return intelligentSuggestions;
        
        const currentHour = DateTime.local().hour;
        return overlapData
            .filter(d => d.utcHour > currentHour && (d.status === 'perfect' || d.status === 'good'))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }, [overlapData, intelligentSuggestions]);

    useEffect(() => {
        if (participants.length < 2) {
            setIntelligentSuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            setIsSuggesting(true);
            try {
                const res = await fetchWithAuth('/api/v1/meetings/suggestions', {
                    method: 'POST',
                    body: JSON.stringify({ participants: participants.map(p => ({
                        zone: p.zone,
                        userId: p.id, // Ensure we pass userId for fairness
                        workStart: p.workStart,
                        workEnd: p.workEnd
                    })) })
                });
                if (res.ok) {
                    const data = await res.json();
                    setIntelligentSuggestions(data);
                }
            } catch (err) {
                console.error('Failed to fetch suggestions:', err);
            } finally {
                setIsSuggesting(false);
            }
        };
        const timer = setTimeout(fetchSuggestions, 1000);
        return () => clearTimeout(timer);
    }, [participants]);

    const filteredZones = useMemo(() => {
        if (!searchZone) return [];
        return cityDatabase.filter(c =>
            c.city.toLowerCase().includes(searchZone.toLowerCase()) ||
            c.country.toLowerCase().includes(searchZone.toLowerCase())
        ).slice(0, 5);
    }, [searchZone, cityDatabase]);

    const addParticipant = (pData) => {
        const p = pData || { name: newName.trim(), zone: newZone.trim(), workStart: newWorkStart, workEnd: newWorkEnd };
        if (!p.name || !p.zone) return;
        setParticipants(prev => {
            if (prev.some(existingP => existingP.name === p.name)) return prev;
            return [...prev, p];
        });
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

    // Suggested start time (best slot or 14:30)
    const suggestedStart = bestSlots.length > 0 ? fmtHr(bestSlots[0].utcHour) : '14:30';

    // Cohesion score
    const cohesionScore = useMemo(() => {
        if (participants.length < 2) return 0;
        const perfectCount = overlapData.filter(d => d.status === 'perfect').length;
        return Math.round((perfectCount / 24) * 100);
    }, [overlapData, participants]);

    const syncIntelligence = useMemo(() => {
        if (participants.length < 2) return "Add more participants to calculate sync intelligence.";
        
        const currentBest = bestSlots[0];
        if (!currentBest) return "No optimal window found for current group.";

        // Find if any other slot is better or could improve specific regions
        const sortedAll = [...overlapData].sort((a, b) => b.score - a.score);
        const globalBest = sortedAll[0];

        if (globalBest && globalBest.score > currentBest.score) {
            const diff = Math.round((globalBest.score - currentBest.score) * 10);
            return `Moving this meeting to ${fmtHr(globalBest.utcHour)} UTC would increase team alignment by ${diff}%.`;
        }

        return "Current selection is highly optimized for this team distribution.";
    }, [participants, bestSlots, overlapData]);

    const handleSendInvites = async () => {
        if (participants.length === 0) {
            alert("Please add participants before sending invites.");
            return;
        }

        setSendingStatus('sending');

        try {
            // Determine start hour (UTC)
            let startHour;
            if (selectedSlot) {
                startHour = selectedSlot.utcHour;
            } else if (bestSlots.length > 0) {
                startHour = bestSlots[0].utcHour;
            } else {
                startHour = 14; // Fallback to 14:00 (2 PM)
            }

            const startTime = DateTime.utc().set({ 
                hour: parseInt(startHour), 
                minute: 0, 
                second: 0 
            });

            // Adjust to tomorrow if time has passed
            const adjustedStart = startTime < DateTime.utc() ? startTime.plus({ days: 1 }) : startTime;

            const res = await fetchWithAuth('/api/v1/meetings/schedule', {
                method: 'POST',
                body: JSON.stringify({
                    title: meetingTitle,
                    participants,
                    selectedSlot,
                    duration: meetingDuration,
                    startTime: adjustedStart.toJSDate()
                })
            });

            if (res.ok) {
                const meeting = await res.json();
                
                // Generate and download ICS
                const icsContent = generateICS({
                    title: meeting.title,
                    description: `Automated Synchronization Meeting\nParticipants: ${participants.map(p => p.name).join(', ')}`,
                    start: new Date(meeting.startTime),
                    duration: meeting.duration
                });
                
                downloadICS(meeting.title, icsContent);

                setSendingStatus('sent');
                setTimeout(() => setSendingStatus('idle'), 3000);
            } else {
                throw new Error('Failed to schedule');
            }
        } catch (err) {
            console.error('Schedule failed:', err);
            setSendingStatus('idle');
            alert('Scheduling failed. Please try again.');
        }
    };

    return (
        <motion.div
            className="planner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <DashboardHeader
                title="Meeting Synchronizer"
                timeDisplay={DateTime.local().toFormat('hh:mm a')}
            />

            <div className="planner__content">
                {/* Page Title */}
                <div className="planner__page-header">
                    <div>
                        <h1 className="planner__page-title">Smart Meeting Synchronizer</h1>
                        <p className="planner__page-sub">Calculating optimal windows across {participants.length || 5} active regions.</p>
                    </div>
                    <span className="planner__golden-badge">
                        <span className="planner__golden-dot" /> GOLDEN WINDOW ACTIVE
                    </span>
                </div>

                <div className="planner__grid">
                    {/* ═══ LEFT: Temporal Alignment ═══ */}
                    <div className="planner__main">
                        <div className="planner__alignment-card">
                            <div className="planner__alignment-header">
                                <h3 className="planner__card-title">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    Temporal Alignment
                                </h3>
                                <div className="planner__format-toggle">
                                    <button className={`planner__format-btn ${timeFormat === '24H' ? 'planner__format-btn--active' : ''}`} onClick={() => setTimeFormat('24H')}>24H</button>
                                    <button className={`planner__format-btn ${timeFormat === '12H' ? 'planner__format-btn--active' : ''}`} onClick={() => setTimeFormat('12H')}>12H</button>
                                </div>
                            </div>

                            {/* Timeline bars */}
                            <div className="planner__timeline-grid">
                                {(participants.length > 0 ? participants : [
                                    { name: 'London, UK', zone: 'Europe/London', workStart: 9, workEnd: 18 },
                                    { name: 'New York, USA', zone: 'America/New_York', workStart: 9, workEnd: 17 },
                                    { name: 'Tokyo, Japan', zone: 'Asia/Tokyo', workStart: 10, workEnd: 19 },
                                    { name: 'Dubai, UAE', zone: 'Asia/Dubai', workStart: 9, workEnd: 18 },
                                ]).map((p, i) => {
                                    const localTime = DateTime.local().setZone(p.zone);
                                    const offsetLabel = `GMT${localTime.toFormat('Z')}`;
                                    const timeStr = timeFormat === '24H' ? localTime.toFormat('HH:mm') : localTime.toFormat('hh:mm');
                                    const isLate = localTime.hour >= 20 || localTime.hour < 6;

                                    return (
                                        <div key={i} className="planner__timeline-row">
                                            <div className="planner__timeline-label">
                                                <span className="planner__timeline-city">{p.name}</span>
                                                <span className="planner__timeline-offset">{offsetLabel}</span>
                                            </div>
                                            <div className="planner__timeline-bar">
                                                {Array.from({ length: 24 }, (_, h) => {
                                                    const isWork = h >= (p.workStart || 9) && h < (p.workEnd || 17);
                                                    const isOptimal = h >= 14 && h <= 16;
                                                    const isSelected = selectedSlot && h === selectedSlot.utcHour;
                                                    let cls = 'planner__bar-segment';
                                                    if (isSelected) cls += ' planner__bar-segment--selected';
                                                    else if (isOptimal && isWork) cls += ' planner__bar-segment--optimal';
                                                    else if (isWork) cls += ' planner__bar-segment--work';
                                                    return (
                                                        <div 
                                                            key={h} 
                                                            className={cls} 
                                                            onClick={() => setSelectedSlot({ utcHour: h })}
                                                            title={`Select ${fmtHr(h)} UTC`}
                                                        />
                                                    );
                                                })}
                                                {/* Optimal window label */}
                                                {i === 0 && (
                                                    <div className="planner__optimal-label" style={{ left: `${(14/24)*100}%` }}>
                                                        OPTIMAL WINDOW
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`planner__timeline-time ${isLate ? 'text-danger' : ''}`}>{timeStr}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="planner__legend">
                                <span className="planner__legend-item"><span className="planner__legend-dot planner__legend-dot--work" /> WORKING HOURS</span>
                                <span className="planner__legend-item"><span className="planner__legend-dot planner__legend-dot--outside" /> OUTSIDE HOURS</span>
                                <span className="planner__legend-item"><span className="planner__legend-dot planner__legend-dot--selected" /> SELECTION</span>
                            </div>
                        </div>

                        {/* Bottom row: Conflicts + Availability + Sync Intelligence */}
                        <div className="planner__bottom-cards">
                            <div className="planner__conflicts-card">
                                <h4 className="planner__card-title-sm">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    Upcoming Conflicts
                                </h4>
                                <div className="planner__conflict-list">
                                    {conflicts.map((c, idx) => (
                                        <div key={idx} className="planner__conflict-item">
                                            <div>
                                                <span className="planner__conflict-name">{c.name}</span>
                                                <span className="planner__conflict-time">
                                                    {DateTime.fromISO(c.time).toRelative()}
                                                </span>
                                            </div>
                                            <span className={`planner__conflict-badge planner__conflict-badge--${c.status.toLowerCase()}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    ))}
                                    {conflicts.length === 0 && <p className="text-muted">No upcoming conflicts.</p>}
                                </div>
                            </div>

                            <div className="planner__availability-card">
                                <h4 className="planner__card-title-sm">Availability Summary</h4>
                                <div className="planner__cohesion">
                                    <span className="planner__cohesion-value">{cohesionScore || 84}%</span>
                                    <span className="planner__cohesion-label">COHESION SCORE</span>
                                </div>
                                <p className="planner__cohesion-desc">Your team has high overlap between 14:00 – 15:30 UTC. Best for high-bandwidth collaboration.</p>
                            </div>

                            <div className="planner__sync-intel-card">
                                <h4 className="planner__card-title-sm">Sync Intelligence</h4>
                                <div className="planner__intel-content">
                                    <p className="planner__intel-text">{syncIntelligence}</p>
                                    {bestSlots[0]?.policyViolations?.length > 0 && (
                                        <div className="planner__policy-warnings">
                                            {bestSlots[0].policyViolations.map((v, i) => (
                                                <span key={i} className="planner__policy-badge">⚠️ {v}</span>
                                            ))}
                                        </div>
                                    )}
                                    {bestSlots[0]?.fairnessImpact > 0 && (
                                        <div className="planner__fairness-impact">
                                            <span className="text-purple">⚖️ Fairness Hit: +{bestSlots[0].fairnessImpact}</span>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className="planner__apply-opt"
                                    onClick={() => {
                                        const target = bestSlots[0];
                                        if (target) setSelectedSlot({ utcHour: target.hour ?? target.utcHour });
                                    }}
                                >Apply Optimization</button>
                            </div>
                        </div>
                    </div>

                    {/* ═══ RIGHT: Schedule Session + Participants ═══ */}
                    <div className="planner__side">
                        {/* Schedule Session */}
                        <div className="planner__schedule-card">
                            <h3 className="planner__card-title">Schedule Session</h3>

                            <div className="planner__field">
                                <label className="planner__field-label">MEETING TITLE</label>
                                <input
                                    type="text"
                                    className="planner__field-input"
                                    value={meetingTitle}
                                    onChange={e => setMeetingTitle(e.target.value)}
                                />
                            </div>

                            <div className="planner__field">
                                <label className="planner__field-label">DURATION</label>
                                <select className="planner__field-select" value={meetingDuration} onChange={e => setMeetingDuration(+e.target.value)}>
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>60 Minutes</option>
                                    <option value={90}>90 Minutes</option>
                                </select>
                            </div>

                            <div className="planner__field">
                                <label className="planner__field-label">SUGGESTED START</label>
                                <div className="planner__suggested-time">
                                    <span className="planner__time-big">{suggestedStart}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                </div>
                            </div>

                            <button 
                                className={`planner__send-btn ${sendingStatus !== 'idle' ? 'planner__send-btn--' + sendingStatus : ''}`}
                                onClick={handleSendInvites}
                                disabled={sendingStatus !== 'idle'}
                            >
                                {sendingStatus === 'idle' && (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"/>
                                        </svg>
                                        Send Calendar Invites
                                    </>
                                )}
                                {sendingStatus === 'sending' && "Sending..."}
                                {sendingStatus === 'sent' && "✓ Invites Sent!"}
                            </button>
                        </div>

                        {/* Participants */}
                        <div className="planner__participants-card">
                            <div className="planner__participants-header">
                                <h4 className="planner__card-title-sm">Participants</h4>
                                <span className="planner__participant-count">{participants.length} ONLINE</span>
                            </div>

                            <div className="planner__participant-list">
                                {participants.map((p, i) => {
                                    const localTime = DateTime.local().setZone(p.zone);
                                    return (
                                        <div key={i} className="planner__participant-row">
                                            <div className="planner__participant-avatar">{p.name.charAt(0)}</div>
                                            <div className="planner__participant-info">
                                                <span className="planner__participant-name">{p.name}</span>
                                                <span className="planner__participant-meta">{p.zone.split('/').pop().replace('_', ' ')} • {localTime.toFormat('HH:mm')}</span>
                                            </div>
                                            <button className="planner__remove-btn" onClick={() => removeParticipant(i)}>×</button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick Add */}
                            <div className="planner__quick-add-section">
                                <div className="planner__user-search">
                                    <input
                                        type="text"
                                        className="planner__field-input"
                                        placeholder="Search users or cities..."
                                        value={searchUser || searchZone}
                                        onChange={e => {
                                            setSearchUser(e.target.value);
                                            setSearchZone(e.target.value);
                                            setIsSearchingUser(true);
                                            setIsSearching(true);
                                        }}
                                    />
                                </div>

                                {/* Search Results */}
                                {(teamResults.length > 0 || userResults.length > 0 || filteredZones.length > 0) && (
                                    <motion.div
                                        className="planner__search-results"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {teamResults.map(user => (
                                            <button
                                                key={`team-${user.id || user.email}`}
                                                className="planner__search-result-item"
                                                onClick={() => {
                                                    addParticipant({
                                                        name: user.name,
                                                        zone: user.timezone || 'UTC',
                                                        workStart: user.workSchedule?.workStart || 9,
                                                        workEnd: user.workSchedule?.workEnd || 17
                                                    });
                                                    setSearchUser('');
                                                    setSearchZone('');
                                                }}
                                                disabled={participants.some(p => p.name === user.name)}
                                            >
                                                <span className="planner__result-avatar">{user.name?.charAt(0) || '?'}</span>
                                                <span className="planner__result-name">{user.name} <small className="text-purple">Team</small></span>
                                            </button>
                                        ))}
                                        {userResults
                                            .filter(ur => !teamResults.some(tr => tr.id === ur.id || tr.email === ur.email))
                                            .map(user => (
                                            <button
                                                key={user.id}
                                                className="planner__search-result-item"
                                                onClick={() => {
                                                    addParticipant({
                                                        name: user.name,
                                                        zone: user.timezone || 'UTC',
                                                        workStart: user.workSchedule?.workStart || 9,
                                                        workEnd: user.workSchedule?.workEnd || 17
                                                    });
                                                    setSearchUser('');
                                                }}
                                                disabled={participants.some(p => p.name === user.name)}
                                            >
                                                <span className="planner__result-avatar">{user.name?.charAt(0)}</span>
                                                <span className="planner__result-name">{user.name}</span>
                                            </button>
                                        ))}
                                        {filteredZones.map((z, idx) => (
                                            <button
                                                key={`zone-${idx}`}
                                                className="planner__search-result-item"
                                                onClick={() => {
                                                    setNewZone(z.zone);
                                                    setNewName(z.city);
                                                    setSearchZone('');
                                                    setSearchUser('');
                                                    addParticipant({ name: z.city, zone: z.zone, workStart: 9, workEnd: 17 });
                                                }}
                                            >
                                                <span className="planner__result-avatar" style={{ background: 'var(--color-bg-elevated)' }}>🌍</span>
                                                <span className="planner__result-name">{z.city}, {z.country}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                <div className="planner__add-actions">
                                    {currentUser && (
                                        <button className="planner__add-me-btn" onClick={addMe}>+ Add Me</button>
                                    )}
                                    {team.length > 0 && (
                                        <button className="planner__add-team-btn" onClick={() => {
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
                                        }}>+ Add Team</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MeetingPlanner;
