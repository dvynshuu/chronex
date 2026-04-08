import React, { useState, useRef, useEffect } from 'react';
import { DateTime } from 'luxon';
import './DashboardHeader.css';
import NotificationDropdown from './NotificationDropdown';
import GlobalSettingsDropdown from './GlobalSettingsDropdown';
import UserProfileDropdown from './UserProfileDropdown';
import { useTimeFormatter } from '../../hooks/useTimeFormatter';

const DashboardHeader = ({ title, welcomeMessage, timeDisplay, searchTerm, onSearchChange, onQuickAdd }) => {
    const { formatShortTime } = useTimeFormatter();
    const localTime = DateTime.local();
    const [activeDropdown, setActiveDropdown] = useState(null);
    const rightContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rightContainerRef.current && !rightContainerRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (dropdownName) => {
        setActiveDropdown(prev => prev === dropdownName ? null : dropdownName);
    };

    return (
        <header className="topbar">
            <div className="topbar__left">
                <div className="topbar__search">
                    <svg className="topbar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        className="topbar__search-input"
                        placeholder="Scan global nodes..."
                        value={searchTerm || ''}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="topbar__center">
                <span className="topbar__local-time">
                    Local {formatShortTime(localTime)}
                </span>
                <span className="topbar__sync-label">Global Sync</span>
            </div>

            <div className="topbar__right" ref={rightContainerRef} style={{ position: 'relative' }}>
                <button 
                    className={`topbar__icon-btn ${activeDropdown === 'global' ? 'active' : ''}`} 
                    title="Global Settings" 
                    onClick={() => toggleDropdown('global')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                </button>
                <button 
                    className={`topbar__icon-btn ${activeDropdown === 'notifications' ? 'active' : ''}`} 
                    title="Notifications" 
                    onClick={() => toggleDropdown('notifications')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                </button>
                <button className="topbar__quick-add" onClick={onQuickAdd}>Quick Add</button>
                <div 
                    className="topbar__avatar" 
                    onClick={() => toggleDropdown('profile')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>

                <GlobalSettingsDropdown isOpen={activeDropdown === 'global'} />
                <NotificationDropdown isOpen={activeDropdown === 'notifications'} />
                <UserProfileDropdown isOpen={activeDropdown === 'profile'} onClose={() => setActiveDropdown(null)} />
            </div>
        </header>
    );
};

export default DashboardHeader;
