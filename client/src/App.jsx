import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import Dashboard from './views/Dashboard';
import MeetingPlanner from './views/MeetingPlanner';
import TeamDashboard from './views/TeamDashboard';
import PublicProfile from './views/PublicProfile';
import Sidebar from './components/Sidebar/Sidebar';

const AppShell = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { toggleTheme } = useTheme();
    const navigate = useNavigate();

    useKeyboardShortcuts({ toggleTheme, navigate });

    return (
        <div className={`app-container ${isCollapsed ? 'app-container--sidebar-collapsed' : ''}`}>
            <div
                className="app-container__sidebar-wrapper"
                onMouseEnter={() => setIsCollapsed(false)}
                onMouseLeave={() => setIsCollapsed(true)}
            >
                <Sidebar isCollapsed={isCollapsed} />
            </div>

            <main className="app-container__content">
                <AnimatePresence mode="wait">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/meetings" element={<MeetingPlanner />} />
                        <Route path="/team" element={<TeamDashboard />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    {/* Public profile — outside sidebar layout */}
                    <Route path="/u/:slug" element={<PublicProfile />} />
                    {/* Main app with sidebar */}
                    <Route path="/*" element={<AppShell />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
