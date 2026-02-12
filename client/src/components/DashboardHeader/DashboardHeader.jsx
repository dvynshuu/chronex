import React from 'react';
import './DashboardHeader.css';

const DashboardHeader = ({ title, welcomeMessage, timeDisplay }) => {
    return (
        <header className="dashboard-header">
            <div className="dashboard-header__content">
                <p className="dashboard-header__welcome">{welcomeMessage}</p>
                <h1 className="dashboard-header__title">{title}</h1>
            </div>
            <div className="dashboard-header__status glass-panel">
                <span className="dashboard-header__label">CURRENT SCRUB TIME</span>
                <span className="dashboard-header__time anim-pulse-glow">{timeDisplay}</span>
            </div>
        </header>
    );
};

export default DashboardHeader;
