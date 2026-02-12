import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './views/Dashboard';
import MeetingPlanner from './views/MeetingPlanner';
import TeamDashboard from './views/TeamDashboard';
import Sidebar from './components/Sidebar/Sidebar';

function App() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <Router>
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
        </Router>
    );
}

export default App;
