import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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


const Sidebar = ({ isCollapsed }) => {

    return (
        <>
            <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
                <div className="sidebar__logo">
                    <Logo size={isCollapsed ? 28 : 32} />
                    {!isCollapsed && <span className="sidebar__brand">CHRONEX</span>}
                </div>

                <nav className="sidebar__nav">
                    <ul className="sidebar__list">
                        <li>
                            <SidebarLink to="/" icon="📊" isCollapsed={isCollapsed} shortcut="1">
                                Dashboard
                            </SidebarLink>
                        </li>
                        <li>
                            <SidebarLink
                                to="/meetings"
                                icon="📅"
                                isCollapsed={isCollapsed}
                                shortcut="2"
                            >
                                Meetings
                            </SidebarLink>
                        </li>
                        <li>
                            <SidebarLink to="/team" icon="👥" isCollapsed={isCollapsed} shortcut="3">
                                Team
                            </SidebarLink>
                        </li>
                        <li>
                            <SidebarLink
                                to="/focus"
                                icon="🎯"
                                isCollapsed={isCollapsed}
                                shortcut="4"
                            >
                                Focus
                            </SidebarLink>
                        </li>
                    </ul>
                </nav>

                {!isCollapsed && (
                    <div className="sidebar__actions">
                        <SidebarLink to="/settings" icon="⚙️" isCollapsed={isCollapsed} shortcut="5">
                            Settings
                        </SidebarLink>
                    </div>
                )}

                {!isCollapsed && (
                    <div className="sidebar__footer">
                        <small className="sidebar__version">v2.0 Enterprise</small>
                        <small className="sidebar__shortcuts-hint">Press keys 1-4 to navigate</small>
                    </div>
                )}
            </aside>

        </>
    );
};

export default Sidebar;
