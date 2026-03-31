import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const Settings = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const { logout } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetchWithAuth('/api/v1/users/me');
                const data = await res.json();
                setUserData(data);
            } catch (err) {
                console.error('Failed to fetch user data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetchWithAuth('/api/v1/users/me', {
                method: 'PATCH',
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Settings saved successfully!');
            } else {
                setError(data.message || data.error?.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const updateSchedule = (field, value) => {
        setUserData(prev => ({
            ...prev,
            workSchedule: { ...prev.workSchedule, [field]: value }
        }));
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'schedule', label: 'Work Schedule', icon: '⏰' },
        { id: 'account', label: 'Account', icon: '🛡️' },
        { id: 'preferences', label: 'Preferences', icon: '🎨' }
    ];

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-header">
                    <h1>Loading...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <header className="settings-header">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Settings
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Manage your identity, availability, and preferences.
                </motion.p>
            </header>

            <div className="settings-grid">
                <aside className="settings-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-nav-btn ${activeTab === tab.id ? 'settings-nav-btn--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                    <div className="settings-nav-divider"></div>
                    <button className="settings-nav-btn logout-btn" onClick={logout}>
                        <span>🚪</span>
                        Logout
                    </button>
                </aside>

                <main className="settings-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'profile' && (
                                <section className="settings-section">
                                    <h2>👤 Profile Information</h2>
                                    <div className="settings-group">
                                        <div className="settings-field">
                                            <label>Display Name</label>
                                            <input
                                                type="text"
                                                className="settings-input"
                                                value={userData.profile?.name || ''}
                                                onChange={e => setUserData({ 
                                                    ...userData, 
                                                    profile: { ...userData.profile, name: e.target.value } 
                                                })}
                                                placeholder="e.g. Alex Rivera"
                                            />
                                        </div>
                                        <div className="settings-field">
                                            <label>Public Profile URL</label>
                                            <div className="settings-slug-wrapper">
                                                <span className="settings-slug-prefix">chronex.app/u/</span>
                                                <input
                                                    type="text"
                                                    className="settings-slug-input"
                                                    value={userData.slug || ''}
                                                    onChange={e => setUserData({ 
                                                        ...userData, 
                                                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                                                    })}
                                                />
                                            </div>
                                            <p className="settings-field-hint">Your public booking page will be available at this URL.</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'schedule' && (
                                <section className="settings-section">
                                    <h2>⏰ Work Schedule</h2>
                                    <p className="settings-section-desc">Define your typical working hours to help Chronex suggest the best meeting times.</p>
                                    <div className="settings-group">
                                        <div className="settings-schedule-grid">
                                            <div className="settings-field">
                                                <label>Work Start</label>
                                                <input
                                                    type="number" min="0" max="23"
                                                    className="settings-input"
                                                    value={userData.workSchedule?.workStart || 9}
                                                    onChange={e => updateSchedule('workStart', +e.target.value)}
                                                />
                                            </div>
                                            <div className="settings-field">
                                                <label>Work End</label>
                                                <input
                                                    type="number" min="0" max="23"
                                                    className="settings-input"
                                                    value={userData.workSchedule?.workEnd || 17}
                                                    onChange={e => updateSchedule('workEnd', +e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'account' && (
                                <section className="settings-section">
                                    <h2>🛡️ Account Settings</h2>
                                    <div className="settings-group">
                                        <div className="settings-field">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                className="settings-input"
                                                value={userData.email || ''}
                                                disabled
                                            />
                                            <p className="settings-field-hint">Email is linked to your authentication provider.</p>
                                        </div>
                                        <div className="settings-divider"></div>
                                        <div className="settings-account-actions">
                                            <h3>Session Management</h3>
                                            <p>Signing out will end your current session and require you to sign back in next time.</p>
                                            <button className="logout-action-btn" onClick={logout}>
                                                <span>🚪</span>
                                                Sign Out Now
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'preferences' && (
                                <section className="settings-section">
                                    <h2>🎨 App Preferences</h2>
                                    <div className="settings-group">
                                        <div className="settings-field">
                                            <label>Theme</label>
                                            <select className="settings-input">
                                                <option value="dark">Premium Dark (Recommended)</option>
                                                <option value="light">Solar Light</option>
                                                <option value="system">System Default</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <div className="settings-error-alert">
                            ⚠️ {error}
                        </div>
                    )}

                    <footer className="settings-footer">
                        <button
                            className="save-button"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving Changes...' : 'Save All Changes'}
                        </button>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default Settings;
