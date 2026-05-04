import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';
import { SocketProvider } from './contexts/SocketContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from './store/useStore';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

// Lazy loaded views for performance
const Dashboard = lazy(() => import('./views/Dashboard'));
const MeetingPlanner = lazy(() => import('./views/MeetingPlanner'));
const TeamDashboard = lazy(() => import('./views/TeamDashboard'));
const FocusWorkspace = lazy(() => import('./views/FocusWorkspace'));
const PublicProfile = lazy(() => import('./views/PublicProfile'));
const Login = lazy(() => import('./views/Login'));
const Signup = lazy(() => import('./views/Signup'));
const Settings = lazy(() => import('./views/Settings'));
const Onboarding = lazy(() => import('./views/Onboarding'));
const GoogleCallback = lazy(() => import('./views/GoogleCallback'));

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
                    <Suspense fallback={
                        <div style={{
                            padding: '2rem',
                            color: 'var(--color-text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            fontSize: '0.9rem'
                        }}>
                            Loading interface...
                        </div>
                    }>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/meetings" element={<MeetingPlanner />} />
                            <Route path="/team" element={<TeamDashboard />} />
                            <Route path="/focus" element={<FocusWorkspace />} />
                            <Route path="/timeline" element={<FocusWorkspace />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/onboarding" element={<Onboarding />} />
                            <Route path="/auth/callback/google" element={<GoogleCallback />} />
                        </Routes>
                    </Suspense>
                </AnimatePresence>
            </main>
        </div>
    );
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <HelmetProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <SocketProvider>
                            <Router>
                                <Suspense fallback={
                                    <div style={{
                                        padding: '2rem',
                                        color: 'var(--color-text-dim)',
                                        height: '100vh',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#0A0E14',
                                        fontSize: '0.9rem'
                                    }}>
                                        Loading Chronex...
                                    </div>
                                }>
                                    <Routes>
                                        {/* Public routes — outside sidebar layout */}
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/signup" element={<Signup />} />
                                        <Route path="/u/:slug" element={<PublicProfile />} />
                                        {/* Protected app with sidebar */}
                                        <Route path="/*" element={
                                            <ProtectedRoute>
                                                <AppShell />
                                            </ProtectedRoute>
                                        } />
                                    </Routes>
                                </Suspense>
                            </Router>
                        </SocketProvider>
                    </AuthProvider>
                </ThemeProvider>
            </HelmetProvider>
        </QueryClientProvider>
    );
}

export default App;
