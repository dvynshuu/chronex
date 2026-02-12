import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Dashboard from './views/Dashboard';
import MeetingPlanner from './views/MeetingPlanner';
import TeamDashboard from './views/TeamDashboard';
import './index.css';

const SidebarLink = ({ to, children, icon, isCollapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="nav-text"
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
            {isCollapsed && <div className="side-tooltip">{children}</div>}
        </Link>
    );
};

function App() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <Router>
            <div className={`app-view ${isCollapsed ? 'side-collapsed' : ''}`}>
                <aside
                    className="nav-side"
                    onMouseEnter={() => setIsCollapsed(false)}
                    onMouseLeave={() => setIsCollapsed(true)}
                >
                    <div className="side-logo u-glow u-bold">
                        {isCollapsed ? 'T.' : 'TIME.IQ'}
                    </div>
                    <nav>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li><SidebarLink to="/" icon="📊" isCollapsed={isCollapsed}>Dashboard</SidebarLink></li>
                            <li><SidebarLink to="/meetings" icon="📅" isCollapsed={isCollapsed}>Meetings</SidebarLink></li>
                            <li><SidebarLink to="/team" icon="👥" isCollapsed={isCollapsed}>Team</SidebarLink></li>
                        </ul>
                    </nav>

                    {!isCollapsed && (
                        <div className="side-footer u-dim">
                            <small>v1.2 Enterprise</small>
                        </div>
                    )}
                </aside>

                <main className="view-panel">
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/meetings" element={<MeetingPlanner />} />
                            <Route path="/team" element={<TeamDashboard />} />
                        </Routes>
                    </AnimatePresence>
                </main>
            </div>
        </Router>
    );
}

export default App;
