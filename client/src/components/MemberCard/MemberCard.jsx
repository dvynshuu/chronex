import React from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { useTimeFormatter } from '../../hooks/useTimeFormatter';
import './MemberCard.css';

const MemberCard = ({ member, liveClock, onInvite, isSelf }) => {
    const { formatShortTime, fmtHr } = useTimeFormatter();
    const localTime = liveClock.setZone(member.timezone);
    const statusClass = member.statusLabel?.toLowerCase().replace(' ', '-') || 'offline';
    
    // Generate 24h timeline data
    const hours = Array.from({ length: 24 }, (_, i) => {
        const h = i;
        const isWorking = h >= (member.workSchedule?.workStart || 9) && h < (member.workSchedule?.workEnd || 17);
        const isSleeping = h >= 22 || h < 5;
        let type = 'off';
        if (isWorking) type = 'work';
        else if (isSleeping) type = 'sleep';
        return { h, type };
    });

    const currentHour = localTime.hour;

    return (
        <motion.div 
            className="member-card glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4, borderColor: 'rgba(0, 229, 255, 0.4)' }}
        >
            <div className="member-card__header">
                <div className="member-card__avatar">
                    {member.name?.charAt(0) || '?'}
                    <span className={`member-card__status-dot status-dot--${statusClass}`}></span>
                </div>
                <div className="member-card__id">
                    <h4 className="member-card__name">
                        {member.name} 
                        {isSelf && <span className="member-card__self-badge">YOU</span>}
                    </h4>
                    <p className="member-card__location">{member.location} • {member.timezone}</p>
                </div>
            </div>

            <div className="member-card__time-row">
                <div className="member-card__local-time">
                    <span className="time-label">Local Time</span>
                    <span className="time-value">{formatShortTime(localTime)}</span>
                </div>
                <div className={`member-card__status status-pill--${statusClass}`}>
                    {member.statusLabel}
                </div>
            </div>

            <div className="member-card__timeline-section">
                <div className="timeline-header">
                    <span>24h Availability</span>
                    <span>{fmtHr(member.workSchedule?.workStart || 9)} – {fmtHr(member.workSchedule?.workEnd || 17)}</span>
                </div>
                <div className="timeline-bar">
                    {hours.map((slot, i) => (
                        <div 
                            key={i} 
                            className={`timeline-slot timeline-slot--${slot.type} ${slot.h === currentHour ? 'timeline-slot--current' : ''}`}
                            title={`${fmtHr(slot.h)}: ${slot.type === 'work' ? 'Working' : slot.type === 'sleep' ? 'Sleeping' : 'Off'}`}
                        >
                            {slot.h === currentHour && <div className="current-indicator"></div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="member-card__actions">
                {!isSelf && (
                    <button className="invite-btn" onClick={() => onInvite(member.id)}>
                        Invite to Meeting
                    </button>
                )}
                <button className="profile-btn" onClick={() => window.open(`/u/${member.slug}`, '_blank')}>
                    View Profile
                </button>
            </div>
        </motion.div>
    );
};

export default MemberCard;
