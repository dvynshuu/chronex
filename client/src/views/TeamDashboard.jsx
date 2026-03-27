import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import useAnimationClock from '../hooks/useAnimationClock';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import { fmtHr } from '../utils/timeUtils';
import MemberCard from '../components/MemberCard/MemberCard';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
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
                const res = await fetchWithAuth('/api/v1/orgs/me');
                if (!res.ok) throw new Error('Failed to fetch team data');
                const data = await res.json();
                setOrg(data);

                // Fetch team meetings
                const mRes = await fetchWithAuth('/api/v1/meetings/team');
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
            const res = await fetchWithAuth('/api/v1/orgs/members', {
                method: 'POST',
                body: JSON.stringify({ email: newMemberEmail })
            });
            const data = await res.json();
            if (!res.ok) {
                // Handle specific cases
                if (res.status === 404) throw new Error(`User "${newMemberEmail}" not found. Have they registered for Chronex yet?`);
                throw new Error(data.message || 'Failed to add member');
            }
            
            // Refresh team data
            const orgRes = await fetchWithAuth('/api/v1/orgs/me');
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

    // Real-time team status calculation
    const teamState = React.useMemo(() => {
        if (!org || !org.members) return { stats: [], activePercent: 0, total: 0 };
        
        let active = 0;
        let away = 0;
        let sleeping = 0;

        org.members.forEach(m => {
            const localH = liveClock.setZone(m.timezone).hour;
            const isWorking = localH >= (m.workSchedule?.workStart || 9) && localH < (m.workSchedule?.workEnd || 17);
            const isSleeping = localH >= 22 || localH < 5;

            if (isWorking) active++;
            else if (isSleeping) sleeping++;
            else away++;
        });

        const total = org.members.length;
        const stats = [
            { name: 'Active', value: active },
            { name: 'Away', value: away },
            { name: 'Sleeping', value: sleeping }
        ];

        return {
            stats,
            activePercent: total > 0 ? Math.round((active / total) * 100) : 0,
            total,
            isPure: stats.filter(s => s.value > 0).length <= 1 // Only one category populated?
        };
    }, [org, liveClock]);

    const teamStats = teamState.stats;
    const activePercentage = teamState.activePercent;

    // Coordination Pulse: Find next hour with max working people
    const nextPeakWindow = React.useMemo(() => {
        if (!org || !org.members) return null;
        const currentHour = DateTime.local().hour;
        let maxCount = 0;
        let peakHour = DateTime.local();

        // Check next 24 hours
        for (let offset = 1; offset <= 24; offset++) {
            const checkTime = DateTime.local().plus({ hours: offset });
            
            let count = 0;
            org.members.forEach(m => {
                const localH = checkTime.setZone(m.timezone).hour;
                const isWorking = localH >= (m.workSchedule?.workStart || 9) && localH < (m.workSchedule?.workEnd || 17);
                if (isWorking) count++;
            });

            if (count > maxCount) {
                maxCount = count;
                peakHour = checkTime;
                if (count === org.members.length) break; // Perfect match found
            }
        }

        return { time: peakHour, count: maxCount };
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
            <DashboardHeader 
                title="Team Intelligence" 
                welcomeMessage="ORGANIZATION COMMAND CENTER" 
                timeDisplay={liveClock.toFormat('hh:mm a')}
            />


            <div className="team-dash__pulse">
                <div className="pulse-icon">⚡</div>
                <div className="pulse-meta">
                    <h5>Coordination Pulse</h5>
                    <p>Next peak team availability window detected.</p>
                </div>
                {nextPeakWindow && (
                    <div className="pulse-window">
                        {nextPeakWindow.time.toFormat('ccc @ hh:mm a')} • {nextPeakWindow.count}/{org.members.length} Present
                    </div>
                )}
            </div>

            <div className="team-dash__analytics">
                <div className="team-dash__card glass-panel">
                    <h6 className="team-dash__card-label">Global Availability</h6>
                    <div className="team-dash__chart-container">
                        <div className="chart-center-label">
                            <span className="chart-center-val">{activePercentage}%</span>
                            <span className="chart-center-text">Available</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ value: 1 }]}
                                    innerRadius="70%"
                                    outerRadius="90%"
                                    dataKey="value"
                                    stroke="none"
                                    fill="rgba(255, 255, 255, 0.03)"
                                    isAnimationActive={false}
                                />
                                <Pie
                                    data={teamStats}
                                    innerRadius="70%"
                                    outerRadius="90%"
                                    paddingAngle={teamState.isPure ? 0 : 8}
                                    dataKey="value"
                                    stroke="none"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {teamStats.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={COLORS[index % COLORS.length]}
                                            style={{ 
                                                filter: entry.value > 0 ? `drop-shadow(0 0 12px ${COLORS[index % COLORS.length]}88)` : 'none' 
                                            }}
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

                <div className="team-dash__card glass-panel">
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

                <div className="team-dash__card glass-panel">
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

            <div className="team-dash__members-section">
                <div className="team-dash__section-header">
                    <h3 className="team-dash__section-title">Team Coordination Grid</h3>
                    <button 
                        className={`team-dash__add-member-toggle ${isAddingMember ? 'active' : ''}`}
                        onClick={() => setIsAddingMember(!isAddingMember)}
                    >
                        {isAddingMember ? '✕ Cancel' : '+ Add Member'}
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

                <div className="team-dash__member-grid">
                    {org.members.map((m) => (
                        <MemberCard 
                            key={m.id} 
                            member={m} 
                            liveClock={liveClock}
                            isSelf={m.id === org.admin}
                            onInvite={(id) => navigate(`/meetings?invite=${id}`)}
                        />
                    ))}
                </div>
            </div>

            <svg width="0" height="0" style={{ position: 'absolute' }}>
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
        </motion.div>
    );
};


export default TeamDashboard;
