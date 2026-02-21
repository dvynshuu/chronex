import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../Logo/Logo';
import './Sidebar.css';

const SidebarLink = ({ to, children, icon, isCollapsed, shortcut }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            <span className="sidebar__icon">{icon}</span>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="sidebar__text"
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
            {!isCollapsed && shortcut && <span className="sidebar__shortcut">{shortcut}</span>}
            {isCollapsed && <div className="sidebar__tooltip">{children}</div>}
        </Link>
    );
};

import SettingsPanel from '../Settings/SettingsPanel';

const Sidebar = ({ isCollapsed }) => {
    const { theme, toggleTheme } = useTheme();
    const [showSharePanel, setShowSharePanel] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // This will be dynamic once we fetch user data in App or Context
    const shareLink = `${window.location.origin}/u/divyanshu`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch {
            // fallback
            const textArea = document.createElement('textarea');
            textArea.value = shareLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <>
            <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
                <div className="sidebar__logo">
                    <Logo size={isCollapsed ? 28 : 32} />
                    {!isCollapsed && <span className="sidebar__brand">CHRONEX</span>}
                </div>

                <nav className="sidebar__nav">
                    <ul className="sidebar__list">
                        <li><SidebarLink to="/" icon="📊" isCollapsed={isCollapsed} shortcut="1">Dashboard</SidebarLink></li>
                        <li><SidebarLink to="/meetings" icon="📅" isCollapsed={isCollapsed} shortcut="2">Meetings</SidebarLink></li>
                        <li><SidebarLink to="/team" icon="👥" isCollapsed={isCollapsed} shortcut="3">Team</SidebarLink></li>
                    </ul>
                </nav>

                {!isCollapsed && (
                    <div className="sidebar__actions">
                        {/* Settings Button */}
                        <button className="sidebar__action-btn" onClick={() => setShowSettings(true)}>
                            <span className="sidebar__action-icon">⚙️</span>
                            <span className="sidebar__action-text">Settings</span>
                        </button>

                        {/* Theme Toggle */}
                        <button className="sidebar__action-btn" onClick={toggleTheme} title="Toggle theme (T)">
                            <span className="sidebar__action-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                            <span className="sidebar__action-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            <span className="sidebar__shortcut">T</span>
                        </button>

                        {/* Share Link */}
                        <button className="sidebar__action-btn" onClick={() => setShowSharePanel(!showSharePanel)}>
                            <span className="sidebar__action-icon">🔗</span>
                            <span className="sidebar__action-text">Share Profile</span>
                        </button>

                        {showSharePanel && (
                            <div className="sidebar__share-panel">
                                <p className="sidebar__share-label">Your public link</p>
                                <div className="sidebar__share-link-row">
                                    <code className="sidebar__share-url">{shareLink}</code>
                                    <button className="sidebar__share-copy" onClick={handleCopy}>
                                        {copySuccess ? '✓' : '📋'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isCollapsed && (
                    <div className="sidebar__footer">
                        <small className="sidebar__version">v2.0 Enterprise</small>
                        <small className="sidebar__shortcuts-hint">Press keys 1-3 to navigate</small>
                    </div>
                )}
            </aside>

            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};

export default Sidebar;
