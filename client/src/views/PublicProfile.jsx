import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';
import useAnimationClock from '../hooks/useAnimationClock';
import './PublicProfile.css';

const PublicProfile = () => {
    const { slug } = useParams();
    const liveClock = useAnimationClock(1000);

    // Mock user data (would come from API in production)
    const user = useMemo(() => ({
        name: slug || 'User',
        timezone: 'Asia/Kolkata',
        workStart: 9,
        workEnd: 18,
        workDays: [1, 2, 3, 4, 5],
        slug
    }), [slug]);

    const [visitorZone, setVisitorZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const userLocalTime = liveClock.setZone(user.timezone);
    const visitorLocalTime = liveClock.setZone(visitorZone);
    const hour = userLocalTime.hour;

    const status = useMemo(() => {
        const isWorkDay = user.workDays.includes(userLocalTime.weekday);
        if (!isWorkDay) return { label: 'Day Off', icon: '🏖️', color: '#64748b' };
        if (hour >= user.workStart && hour < user.workEnd) return { label: 'Available', icon: '🟢', color: '#34d399' };
        if (hour >= 22 || hour < 5) return { label: 'Sleeping', icon: '🌙', color: '#6366f1' };
        if (hour >= 5 && hour < user.workStart) return { label: 'Early Morning', icon: '🌅', color: '#fbbf24' };
        return { label: 'Off Hours', icon: '🏠', color: '#f43f5e' };
    }, [hour, userLocalTime.weekday, user]);

    // Next availability
    const nextAvail = useMemo(() => {
        if (status.label === 'Available') return { text: 'Available now', hoursUntil: 0 };
        let check = userLocalTime;
        for (let d = 0; d < 7; d++) {
            const day = check.plus({ days: d });
            if (!user.workDays.includes(day.weekday)) continue;
            const start = day.set({ hour: user.workStart, minute: 0, second: 0 });
            if (start > userLocalTime) {
                const diff = start.diff(userLocalTime, 'hours').hours;
                return { text: start.toFormat('EEE hh:mm a'), hoursUntil: diff.toFixed(1) };
            }
        }
        return { text: 'No upcoming availability', hoursUntil: null };
    }, [userLocalTime, user, status]);

    // Overlap for 24h
    const overlapData = useMemo(() => {
        const now = DateTime.utc().startOf('day');
        return Array.from({ length: 24 }, (_, h) => {
            const utcH = now.plus({ hours: h });
            const uLocal = utcH.setZone(user.timezone).hour;
            const vLocal = utcH.setZone(visitorZone).hour;
            const uWorking = uLocal >= user.workStart && uLocal < user.workEnd;
            const vWorking = vLocal >= 9 && vLocal < 17;
            const overlap = uWorking && vWorking;
            return { hour: h, overlap, uLocal, vLocal, uWorking, vWorking };
        });
    }, [user, visitorZone]);

    const overlapHours = overlapData.filter(d => d.overlap).length;

    return (
        <motion.div className="public-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="public-profile__container">
                {/* Header */}
                <div className="public-profile__header glass-panel">
                    <div className="public-profile__avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <h1 className="public-profile__name">{user.name}</h1>
                    <p className="public-profile__tz">{user.timezone}</p>

                    <div className="public-profile__time-display">
                        {userLocalTime.toFormat('hh:mm:ss a')}
                    </div>
                    <p className="public-profile__date">{userLocalTime.toFormat('EEEE, MMMM dd, yyyy')}</p>

                    <div className="public-profile__status" style={{ '--status-color': status.color }}>
                        <span className="public-profile__status-icon">{status.icon}</span>
                        <span className="public-profile__status-label">{status.label}</span>
                    </div>
                </div>

                {/* Next Availability */}
                <div className="public-profile__card glass-panel">
                    <h3 className="public-profile__card-title">Next Available</h3>
                    <div className="public-profile__next-avail">
                        <span className="public-profile__next-time">{nextAvail.text}</span>
                        {nextAvail.hoursUntil > 0 && (
                            <span className="public-profile__next-hours">in {nextAvail.hoursUntil}h</span>
                        )}
                    </div>
                </div>

                {/* Overlap Calculator */}
                <div className="public-profile__card glass-panel">
                    <h3 className="public-profile__card-title">Meeting Overlap</h3>
                    <div className="public-profile__overlap-input">
                        <label className="public-profile__label">Your timezone</label>
                        <input
                            type="text"
                            className="public-profile__input"
                            value={visitorZone}
                            onChange={e => setVisitorZone(e.target.value)}
                            placeholder="e.g. America/New_York"
                        />
                    </div>
                    <div className="public-profile__overlap-summary">
                        <span className="public-profile__overlap-count">{overlapHours}</span>
                        <span className="public-profile__overlap-label">overlapping work hours today</span>
                    </div>

                    <div className="public-profile__overlap-track">
                        {overlapData.map((d, i) => (
                            <div
                                key={i}
                                className={`public-profile__overlap-bar ${d.overlap ? 'public-profile__overlap-bar--overlap' : ''}`}
                                title={`${d.hour}:00 UTC — ${d.uWorking ? '✅' : '❌'} ${user.name} / ${d.vWorking ? '✅' : '❌'} You`}
                            ></div>
                        ))}
                    </div>
                    <div className="public-profile__overlap-labels">
                        <span>00:00 UTC</span>
                        <span>12:00 UTC</span>
                        <span>23:00 UTC</span>
                    </div>
                </div>

                {/* Branding */}
                <div className="public-profile__branding">
                    Powered by <strong>Chronex</strong>
                </div>
            </div>
        </motion.div>
    );
};

export default PublicProfile;
