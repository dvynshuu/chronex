import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useAnimationClock from '../hooks/useAnimationClock';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import { fmtHr } from '../utils/timeUtils';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import './TeamDashboard.css';

// Data is now fetched dynamically from the backend
const TeamDashboard = () => {
    const liveClock = useAnimationClock(10000);
    const [org, setOrg] = React.useState(null);
    const [meetings, setMeetings] = React.useState([]);
    const [teamStats, setTeamStats] = React.useState({ weeklyEnergy: [], temporalPulse: [] });
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

                const mRes = await fetchWithAuth('/api/v1/meetings/team');
                if (mRes.ok) {
                    const mData = await mRes.json();
                    setMeetings(mData);
                }

                const statsRes = await fetchWithAuth('/api/v1/dashboard/team-stats');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setTeamStats(statsData);
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
                if (res.status === 404) throw new Error(`User "${newMemberEmail}" not found. Have they registered for Chronex yet?`);
                throw new Error(data.message || 'Failed to add member');
            }
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

    const teamState = React.useMemo(() => {
        if (!org || !org.members) return { active: 0, dnd: 0, total: 0 };
        let active = 0;
        let dnd = 0;

        org.members.forEach(m => {
            const localH = liveClock.setZone(m.timezone).hour;
            const isWorking = localH >= (m.workSchedule?.workStart || 9) && localH < (m.workSchedule?.workEnd || 17);
            if (isWorking) active++;
            else dnd++;
        });

        return { active, dnd, total: org.members.length };
    }, [org, liveClock]);

    const nextPeakWindow = React.useMemo(() => {
        if (!org || !org.members) return null;
        let maxCount = 0;
        let peakHour = DateTime.local();

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
                if (count === org.members.length) break;
            }
        }
        return { time: peakHour, count: maxCount };
    }, [org]);



    if (loading) return <div className="team-loading">Loading Team Insights...</div>;
    if (error) return <div className="team-error">Error: {error}</div>;
    if (!org) return <div className="team-empty">No Organization Found. Create one in Settings to begin.</div>;

    const featured = org.members[0];
    const sideMember = org.members[1];
    const compactMembers = org.members.slice(2, 5);

    return (
        <motion.div
            className="team-dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <DashboardHeader
                title="Team Availability"
                timeDisplay={liveClock.toFormat('hh:mm a')}
            />

            <div className="team-dash__content">
                {/* Page Header */}
                <div className="team-dash__page-header">
                    <div>
                        <h1 className="team-dash__page-title">Team Availability</h1>
                        <p className="team-dash__page-sub">Real-time pulse and temporal alignment across {teamState.total} time zones.</p>
                    </div>
                    <div className="team-dash__status-badges">
                        <span className="team-dash__badge team-dash__badge--active">
                            <span className="team-dash__badge-dot" style={{ background: 'var(--color-primary)' }} />
                            {teamState.active} Active
                        </span>
                        <span className="team-dash__badge team-dash__badge--dnd">
                            <span className="team-dash__badge-dot" style={{ background: 'var(--color-danger)' }} />
                            {teamState.dnd} DND
                        </span>
                    </div>
                </div>

                {/* ═══ Top Row: Featured + Side Member ═══ */}
                <div className="team-dash__top-row">
                    {/* Featured Member Card */}
                    {featured && (
                        <div className="team-dash__featured-card">
                            <div className="team-dash__featured-left">
                                <div className="team-dash__featured-avatar">
                                    {featured.name?.charAt(0) || '?'}
                                    <span className="team-dash__online-dot" />
                                </div>
                                <h3 className="team-dash__featured-name">{featured.name}</h3>
                                <p className="team-dash__featured-role">{featured.location || 'Engineering'}</p>
                                <div className="team-dash__featured-time">
                                    <span className="team-dash__featured-clock">{liveClock.setZone(featured.timezone).toFormat('hh:mm')}</span>
                                    <span className="team-dash__featured-period">{liveClock.setZone(featured.timezone).toFormat('a')}</span>
                                </div>
                                <p className="team-dash__featured-tz">{featured.timezone?.split('/').pop().replace('_', ' ')} ({featured.timezone?.split('/')[0]})</p>
                                <div className="team-dash__featured-actions">
                                    <button className="team-dash__action-btn team-dash__action-btn--outline">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                        Sync Message
                                    </button>
                                    <button className="team-dash__action-btn team-dash__action-btn--primary" onClick={() => navigate(`/meetings?invite=${featured.id}`)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                                        Schedule 1:1
                                    </button>
                                </div>
                            </div>
                            <div className="team-dash__featured-right">
                                <div className="team-dash__pulse-header">
                                    <span className="team-dash__pulse-label">TEMPORAL PULSE (7 DAYS)</span>
                                    <span className="team-dash__pulse-metric text-cyan">ATTENDANCE 98%</span>
                                </div>
                                <div className="team-dash__pulse-bars">
                                    {teamStats.temporalPulse.map((d, i) => (
                                        <div key={i} className="team-dash__pulse-bar-wrapper">
                                            <div
                                                className="team-dash__pulse-bar"
                                                style={{
                                                    height: `${d.val}%`,
                                                    background: d.val > 70 ? 'var(--color-primary)' :
                                                                d.val > 40 ? 'var(--color-secondary)' : 'var(--color-text-muted)'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Side Member Card */}
                    {sideMember && (
                        <div className="team-dash__side-card">
                            <div className="team-dash__side-header">
                                <div className="team-dash__side-avatar">
                                    {sideMember.name?.charAt(0) || '?'}
                                    <span className="team-dash__online-dot" />
                                </div>
                                <div className="team-dash__side-info">
                                    <span className="team-dash__side-name">{sideMember.name}</span>
                                    <span className="team-dash__side-status text-cyan">ACTIVE NOW</span>
                                </div>
                                <div className="team-dash__side-time">
                                    <span>{liveClock.setZone(sideMember.timezone).toFormat('hh:mm a')}</span>
                                    <span className="team-dash__side-tz">{sideMember.timezone?.split('/').pop().replace('_', ' ')} ({sideMember.timezone?.split('/')[0]})</span>
                                </div>
                            </div>
                            <div className="team-dash__workload">
                                <div className="team-dash__workload-header">
                                    <span>Work Load</span>
                                    <span>Optimal</span>
                                </div>
                                <div className="team-dash__workload-bar">
                                    <div className="team-dash__workload-fill" style={{ width: '65%' }} />
                                </div>
                            </div>
                            <button className="team-dash__request-btn">Request Availability</button>
                        </div>
                    )}
                </div>

                {/* ═══ Compact Member Cards Row ═══ */}
                {compactMembers.length > 0 && (
                    <div className="team-dash__compact-row">
                        {compactMembers.map(m => {
                            const localTime = liveClock.setZone(m.timezone);
                            const localH = localTime.hour;
                            const isWorking = localH >= (m.workSchedule?.workStart || 9) && localH < (m.workSchedule?.workEnd || 17);
                            const isSleeping = localH >= 22 || localH < 5;
                            const statusLabel = isWorking ? 'Active - Working' : isSleeping ? 'Sleeping' : 'Away';
                            const statusColor = isWorking ? 'var(--color-primary)' : isSleeping ? 'var(--color-danger)' : 'var(--color-warning)';

                            return (
                                <div key={m.id} className="team-dash__compact-card">
                                    <div className="team-dash__compact-top">
                                        <div className="team-dash__compact-avatar">
                                            {m.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="team-dash__compact-info">
                                            <span className="team-dash__compact-name">{m.name}</span>
                                            <span className="team-dash__compact-status" style={{ color: statusColor }}>{statusLabel}</span>
                                        </div>
                                        <button className="team-dash__compact-menu" title="More">⋮</button>
                                    </div>
                                    <div className="team-dash__compact-bottom">
                                        <span className="team-dash__compact-time">{localTime.toFormat('hh:mm a')}</span>
                                        <div className="team-dash__compact-actions">
                                            {isSleeping && <span className="team-dash__dnd-badge">DO NOT DISTURB</span>}
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add member toggle */}
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

                {/* ═══ Bottom Row: Weekly Velocity + Cross-Region Energy ═══ */}
                <div className="team-dash__bottom-row">
                    {/* Weekly Velocity */}
                    <div className="team-dash__velocity-card">
                        <h3 className="team-dash__card-title">Weekly Velocity</h3>
                        <p className="team-dash__velocity-desc">Overall team sync efficiency has improved by <strong className="text-cyan">16%</strong> this week due to adjusted stand-up times.</p>
                        <div className="team-dash__velocity-stats">
                            <div className="team-dash__velocity-stat">
                                <span className="team-dash__velocity-label">PEAK PULSE</span>
                                <span className="team-dash__velocity-value">{nextPeakWindow ? nextPeakWindow.time.toFormat('HH:mm') : '14:00'} <small className="text-dim">UTC</small></span>
                            </div>
                            <div className="team-dash__velocity-stat">
                                <span className="team-dash__velocity-label">OVERLAP WINDOW</span>
                                <span className="team-dash__velocity-value">3.5<small className="text-dim">h</small></span>
                            </div>
                        </div>
                    </div>

                    {/* Cross-Region Energy Output */}
                    <div className="team-dash__energy-card">
                        <div className="team-dash__energy-header">
                            <h3 className="team-dash__card-title">Cross-Region Energy Output</h3>
                            <div className="team-dash__energy-legend">
                                <span className="team-dash__energy-legend-item"><span style={{ background: 'var(--color-primary)' }} /> NAMER</span>
                                <span className="team-dash__energy-legend-item"><span style={{ background: 'var(--color-secondary)' }} /> EMEA</span>
                                <span className="team-dash__energy-legend-item"><span style={{ background: 'var(--color-tertiary)' }} /> APAC</span>
                            </div>
                        </div>
                        <div className="team-dash__energy-chart">
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={teamStats.weeklyEnergy} barSize={18} barGap={2}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{
                                            background: 'rgba(13, 17, 23, 0.95)',
                                            border: '1px solid rgba(0, 229, 255, 0.2)',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem'
                                        }}
                                    />
                                    <Bar dataKey="namer" stackId="a" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="emea" stackId="a" fill="var(--color-secondary)" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="apac" stackId="a" fill="var(--color-tertiary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamDashboard;
