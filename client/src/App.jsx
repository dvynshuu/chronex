import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { FocusProvider } from './components/FocusEngine/FocusContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './views/Dashboard';
import MeetingPlanner from './views/MeetingPlanner';
import TeamDashboard from './views/TeamDashboard';
import FocusWorkspace from './views/FocusWorkspace';
import PublicProfile from './views/PublicProfile';
import Login from './views/Login';
import Signup from './views/Signup';
import Sidebar from './components/Sidebar/Sidebar';

const AppShell = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    useKeyboardShortcuts({ navigate });

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
                        <Route path="/focus" element={<FocusWorkspace />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public routes — outside sidebar layout */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/u/:slug" element={<PublicProfile />} />
                        {/* Protected app with sidebar */}
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <FocusProvider>
                                    <AppShell />
                                </FocusProvider>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;

