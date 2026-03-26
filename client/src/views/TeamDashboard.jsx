import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import useAnimationClock from '../hooks/useAnimationClock';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router-dom';
import { fmtHr } from '../utils/timeUtils';
import './TeamDashboard.css';

const TeamDashboard = () => {
    const liveClock = useAnimationClock(10000); // 10s is enough for team updates
    const [org, setOrg] = React.useState(null);
    const [meetings, setMeetings] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [isAddingMember, setIsAddingMember] = React.useState(false);
    const [newMemberEmail, setNewMemberEmail] = React.useState('');
    const [addLoading, setAddLoading] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const token = localStorage.getItem('chronex_token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const res = await fetch('/api/v1/orgs/me', { headers });
                if (!res.ok) throw new Error('Failed to fetch team data');
                const data = await res.json();
                setOrg(data);

                // Fetch team meetings
                const mRes = await fetch('/api/v1/meetings/team', { headers });
                if (mRes.ok) {
                    const mData = await mRes.json();
                    setMeetings(mData);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, []);

    const handleAddMember = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        try {
            const token = localStorage.getItem('chronex_token');
            const res = await fetch('/api/v1/orgs/members', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ email: newMemberEmail })
            });
            const data = await res.json();
            if (!res.ok) {
                // Handle specific cases
                if (res.status === 404) throw new Error(`User "${newMemberEmail}" not found. Have they registered for Chronex yet?`);
                throw new Error(data.message || 'Failed to add member');
            }
            
            // Refresh team data
            const orgRes = await fetch('/api/v1/orgs/me', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const orgData = await orgRes.json();
            setOrg(orgData);
            
            setNewMemberEmail('');
            setIsAddingMember(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setAddLoading(false);
        }
    };

    const teamStats = React.useMemo(() => {
        if (!org) return [];
        return [
            { name: 'Active', value: org.stats.active },
            { name: 'Away', value: org.stats.away },
            { name: 'Sleeping', value: org.stats.sleeping }
        ];
    }, [org]);

    // Synthetic activity data based on seat count
    const activityData = React.useMemo(() => {
        const total = org?.stats?.total || 3;
        return [
            { day: 'Mon', usage: Math.min(100, (total * 15)) },
            { day: 'Tue', usage: Math.min(100, (total * 12)) },
            { day: 'Wed', usage: Math.min(100, (total * 22)) },
            { day: 'Thu', usage: Math.min(100, (total * 25)) },
            { day: 'Fri', usage: Math.min(100, (total * 18)) }
        ];
    }, [org]);

    const COLORS = ['#4ade80', '#facc15', '#fb7185'];

    if (loading) return <div className="team-dash-loading">Loading Team Insights...</div>;
    if (error) return <div className="team-dash-error">Error: {error}</div>;
    if (!org) return <div className="team-dash-empty">No Organization Found. Create one in Settings to begin.</div>;

    return (
        <motion.div
            className="team-dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="team-dash__title">Team Intelligence</h1>

            <svg width="0" height="0">
                <defs>
                    <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4DA3FF" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6C63FF" stopOpacity={0.6} />
                    </linearGradient>
                    <radialGradient id="pieGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(77, 163, 255, 0.2)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                </defs>
            </svg>

            <div className="team-dash__grid">
                <div className="team-dash__col">
                    <div className="team-dash__card">
                        <h6 className="team-dash__card-label">Global Availability</h6>
                        <div className="team-dash__chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={teamStats}
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {teamStats.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={COLORS[index % COLORS.length]}
                                                style={{ filter: `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}44)` }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(11, 18, 32, 0.95)',
                                            border: '1px solid rgba(77, 163, 255, 0.4)',
                                            borderRadius: '8px',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="team-dash__col">
                    <div className="team-dash__card">
                        <h6 className="team-dash__card-label">System Activity</h6>
                        <div className="team-dash__chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} dy={10} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{
                                            background: 'rgba(11, 18, 32, 0.95)',
                                            border: '1px solid rgba(77, 163, 255, 0.4)',
                                            borderRadius: '8px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                        }}
                                    />
                                    <Bar dataKey="usage" fill="url(#usageGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="team-dash__col">
                    <div className="team-dash__card">
                        <h6 className="team-dash__card-label">Latest Team Meetings</h6>
                        <div className="team-dash__meetings-list">
                            {meetings.length === 0 ? (
                                <div className="team-dash__no-meetings">No team meetings planned.</div>
                            ) : (
                                meetings.map(m => (
                                    <div key={m._id} className="team-dash__meeting-item" onClick={() => navigate('/meetings')}>
                                        <div className="team-dash__meeting-info">
                                            <span className="team-dash__meeting-title">{m.title}</span>
                                            <span className="team-dash__meeting-meta">{m.participants.length} participants</span>
                                        </div>
                                        <div className="team-dash__meeting-time">
                                            {m.selectedSlot && m.selectedSlot.utcHour !== undefined ? `Today @ ${fmtHr(m.selectedSlot.utcHour)}` : 'Planning...'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="team-dash__table-section">
                <div className="team-dash__table-header">
                    <h5 className="team-dash__section-title">Shared Schedules</h5>
                    <button 
                        className={`team-dash__add-member-toggle ${isAddingMember ? 'active' : ''}`}
                        onClick={() => setIsAddingMember(!isAddingMember)}
                    >
                        {isAddingMember ? '✕' : '+ Add Member'}
                    </button>
                </div>

                <AnimatePresence>
                    {isAddingMember && (
                        <motion.form 
                            className="team-dash__add-form"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={handleAddMember}
                        >
                            <input 
                                type="email" 
                                placeholder="Colleague's email..." 
                                className="team-dash__add-input"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="team-dash__add-submit" disabled={addLoading}>
                                {addLoading ? 'Adding...' : 'Add to team'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
                <div className="team-dash__table-wrapper">
                    <table className="team-dash__table">
                        <thead>
                            <tr>
                                <th>Team Member</th>
                                <th>Primary Location</th>
                                <th>Local Time</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {org.members.map((m) => {
                                // Skip self if desired, but good for testing
                                const isSelf = m.id === org.admin; // simplistic check
                                const localTime = liveClock.setZone(m.timezone);
                                const statusClass = m.statusLabel.toLowerCase().replace(' ', '-');

                                return (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td>{m.location}</td>
                                        <td>{localTime.toFormat('hh:mm a')}</td>
                                        <td>
                                            <span className={`status-pill status-pill--${statusClass}`}>
                                                {m.statusLabel}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {!isSelf && (
                                                <button 
                                                    className="team-dash__invite-btn"
                                                    onClick={() => navigate(`/meetings?invite=${m.id}`)}
                                                >
                                                    Invite
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};


export default TeamDashboard;
