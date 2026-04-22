import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from '../Logo/Logo';
import './Sidebar.css';

const NAV_ITEMS = [
    {
        to: '/',
        label: 'Dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        ),
    },
    {
        to: '/meetings',
        label: 'Meetings',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
        ),
    },
    {
        to: '/team',
        label: 'Team',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        ),
    },
    {
        to: '/focus',
        label: 'Focus',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
    },
];

const BOTTOM_ITEMS = [];

const SidebarLink = ({ to, children, icon, isCollapsed }) => {
    const location = useLocation();
    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

    return (
        <Link to={to} className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            {isActive && <span className="sidebar__active-bar" />}
            <span className="sidebar__icon">{icon}</span>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="sidebar__text"
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
            {isCollapsed && <div className="sidebar__tooltip">{children}</div>}
        </Link>
    );
};


const Sidebar = ({ isCollapsed }) => {
    return (
        <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
            {/* Brand */}
            <div className="sidebar__brand-section">
                <div className="sidebar__logo">
                    <Logo size={isCollapsed ? 26 : 28} color="#00E5FF" />
                    {!isCollapsed && (
                        <div className="sidebar__brand-text">
                            <span className="sidebar__brand-name">Chronex</span>
                            <span className="sidebar__brand-sub">GLOBAL INTELLIGENCE</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Nav */}
            <nav className="sidebar__nav">
                <ul className="sidebar__list">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.to}>
                            <SidebarLink to={item.to} icon={item.icon} isCollapsed={isCollapsed}>
                                {item.label}
                            </SidebarLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Spacer */}
            <div className="sidebar__spacer" />

            {/* Add Region Button */}
            {!isCollapsed && (
                <button className="sidebar__add-region-btn">
                    <span>+</span> Add Region
                </button>
            )}

            {/* Bottom Nav */}
            <div className="sidebar__bottom-nav">
                {BOTTOM_ITEMS.map((item) => (
                    <SidebarLink key={item.label} to={item.to} icon={item.icon} isCollapsed={isCollapsed}>
                        {item.label}
                    </SidebarLink>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
