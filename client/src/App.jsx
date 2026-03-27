import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { FocusProvider } from './components/FocusEngine/FocusContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';

// Lazy loaded views for performance
const Dashboard = lazy(() => import('./views/Dashboard'));
const MeetingPlanner = lazy(() => import('./views/MeetingPlanner'));
const TeamDashboard = lazy(() => import('./views/TeamDashboard'));
const FocusWorkspace = lazy(() => import('./views/FocusWorkspace'));
const PublicProfile = lazy(() => import('./views/PublicProfile'));
const Login = lazy(() => import('./views/Login'));
const Signup = lazy(() => import('./views/Signup'));
const Settings = lazy(() => import('./views/Settings'));

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
                    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--color-text-dim)' }}>Loading interface...</div>}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/meetings" element={<MeetingPlanner />} />
                            <Route path="/team" element={<TeamDashboard />} />
                            <Route path="/focus" element={<FocusWorkspace />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </Suspense>
                </AnimatePresence>
            </main>
        </div>
    );
};

function App() {
    return (
        <HelmetProvider>
            <ThemeProvider>
                <AuthProvider>
                    <Router>
                        <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--color-text-dim)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading application...</div>}>
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
                        </Suspense>
                    </Router>
                </AuthProvider>
            </ThemeProvider>
        </HelmetProvider>
    );
}

export default App;

