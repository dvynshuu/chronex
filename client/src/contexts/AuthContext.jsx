import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

const API_BASE = '/api/v1/auth';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
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
                } else if (res.status === 401) {
                    // Token expired or invalid
                    console.warn('Session restoration failed (401). Clearing stale tokens.');
                    localStorage.removeItem('chronex_token');
                    localStorage.removeItem('chronex_refresh_token');
                }
            } catch (err) {
                console.error('Session restoration error:', err);
                localStorage.removeItem('chronex_token');
                localStorage.removeItem('chronex_refresh_token');
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
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
        setUser(data.user);
        return data;
    }, []);

    const signup = useCallback(async ({ name, email, password }) => {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || data.error?.message || 'Signup failed');
        }
        localStorage.setItem('chronex_token', data.accessToken);
        localStorage.setItem('chronex_refresh_token', data.refreshToken);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('chronex_token');
        localStorage.removeItem('chronex_refresh_token');
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
