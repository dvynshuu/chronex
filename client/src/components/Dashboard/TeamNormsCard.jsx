import React from 'react';
import { motion } from 'framer-motion';
import './TeamNormsCard.css';

const TeamNormsCard = ({ norms, syncSentiment, cpi }) => {
    if (!norms) return null;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const noMeetingDays = norms.noMeetingDays?.map(d => days[d]) || [];

    return (
        <div className="norms-card">
            <div className="norms-card__header">
                <div>
                    <h3 className="norms-card__title">Coordination Moat</h3>
                    <p className="norms-card__subtitle">Minimizing team friction</p>
                </div>
                <div className="norms-card__sentiment">
                    <span className="norms-card__sentiment-val">{Math.round(cpi?.index || 92)}</span>
                    <span className="norms-card__sentiment-label">CPI SCORE</span>
                </div>
            </div>

            <div className="norms-card__cpi-factors">
                <div className="norms-card__factor">
                    <label>Sleep Disruption</label>
                    <div className="norms-card__factor-bar"><div style={{ width: `${cpi?.factors?.sleepDisruption || 12}%`, background: '#ef4444' }} /></div>
                </div>
                <div className="norms-card__factor">
                    <label>Attention Cost</label>
                    <div className="norms-card__factor-bar"><div style={{ width: `${cpi?.factors?.attentionCost || 24}%`, background: '#3b82f6' }} /></div>
                </div>
                <div className="norms-card__factor">
                    <label>Inequity</label>
                    <div className="norms-card__factor-bar"><div style={{ width: `${cpi?.factors?.inequity || 8}%`, background: '#8b5cf6' }} /></div>
                </div>
            </div>

            <div className="norms-card__grid">
                <div className="norms-card__item">
                    <div className="norms-card__icon">🛡️</div>
                    <div className="norms-card__info">
                        <span className="norms-card__label">Policy</span>
                        <span className="norms-card__value">
                            {noMeetingDays.length > 0 ? `No-Meeting ${noMeetingDays.join(', ')}` : 'No active policies'}
                        </span>
                    </div>
                </div>

                <div className="norms-card__item">
                    <div className="norms-card__icon">🧘</div>
                    <div className="norms-card__info">
                        <span className="norms-card__label">Focus Window</span>
                        <span className="norms-card__value">
                            {norms.focusWindow?.start}:00 - {norms.focusWindow?.end}:00
                        </span>
                    </div>
                </div>

                <div className="norms-card__item">
                    <div className="norms-card__icon">⚖️</div>
                    <div className="norms-card__info">
                        <span className="norms-card__label">Fairness</span>
                        <span className="norms-card__value">
                            {norms.fairnessEnabled ? 'Active Balancing' : 'Off'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="norms-card__footer">
                <p className="norms-card__hint">
                    "Remembering reality": Intelligence computed from {syncSentiment > 90 ? 'optimal' : 'improving'} meeting patterns.
                </p>
            </div>
        </div>
    );
};

export default TeamNormsCard;
