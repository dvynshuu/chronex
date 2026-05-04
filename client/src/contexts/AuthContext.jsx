import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

const PROD_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE = `${PROD_API_URL}/api/v1/auth`;

export const AuthProvider = ({ children }) => {
    // Attempt to load initial user synchronously to avoid loading screen flash
    const getInitialUser = () => {
        try {
            const storedUser = localStorage.getItem('chronex_user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    };

    const initialUser = getInitialUser();
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(!initialUser);

    // Restore session on mount
    useEffect(() => {
        const handleLogout = () => setUser(null);
        window.addEventListener('chronex:logout', handleLogout);

        const restoreSession = async () => {
            const token = localStorage.getItem('chronex_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    localStorage.setItem('chronex_user', JSON.stringify(data.user));
                } else if (res.status === 401) {
                    // Token expired or invalid
                    console.warn('Session restoration failed (401). Clearing stale tokens.');
                    localStorage.removeItem('chronex_token');
                    localStorage.removeItem('chronex_refresh_token');
                    localStorage.removeItem('chronex_user');
                    setUser(null);
                }
            } catch (err) {
                console.error('Session restoration error:', err);
                localStorage.removeItem('chronex_token');
                localStorage.removeItem('chronex_refresh_token');
                localStorage.removeItem('chronex_user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
        return () => window.removeEventListener('chronex:logout', handleLogout);
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.error('[DEBUG] Login response failure:', res.status, data);
            throw new Error(data.message || data.error?.message || 'Login failed');
        }
        localStorage.setItem('chronex_token', data.accessToken);
        localStorage.setItem('chronex_refresh_token', data.refreshToken);
        localStorage.setItem('chronex_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    }, []);

    const signup = useCallback(async ({ name, email, password }) => {
        // Automatically detect user's timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, timezone }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || data.error?.message || 'Signup failed');
        }
        localStorage.setItem('chronex_token', data.accessToken);
        localStorage.setItem('chronex_refresh_token', data.refreshToken);
        localStorage.setItem('chronex_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('chronex_token');
        localStorage.removeItem('chronex_refresh_token');
        localStorage.removeItem('chronex_user');
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('chronex_user', JSON.stringify(updatedUser));
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
