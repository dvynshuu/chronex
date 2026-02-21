import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/v1/users/me')
                .then(res => res.json())
                .then(data => {
                    setUserData(data);
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/v1/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            onClose();
        } catch (err) {
            console.error('Save failed:', err);
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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="settings-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="settings-panel glass-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="settings-panel__header">
                        <h3>User Settings</h3>
                        <button className="settings-panel__close" onClick={onClose}>×</button>
                    </div>

                    {loading ? (
                        <div className="settings-panel__loading">Loading profiles...</div>
                    ) : (
                        <div className="settings-panel__content">
                            <section className="settings-panel__section">
                                <label>Profile Name</label>
                                <input
                                    type="text"
                                    className="settings-panel__input"
                                    value={userData.profile?.name || ''}
                                    onChange={e => setUserData({ ...userData, profile: { ...userData.profile, name: e.target.value } })}
                                />
                            </section>

                            <section className="settings-panel__section">
                                <label>Public Slug (chronex.app/u/<b>{userData.slug}</b>)</label>
                                <input
                                    type="text"
                                    className="settings-panel__input"
                                    value={userData.slug || ''}
                                    onChange={e => setUserData({ ...userData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                />
                            </section>

                            <section className="settings-panel__section">
                                <label>Work Schedule</label>
                                <div className="settings-panel__grid">
                                    <div>
                                        <small>Start Hour</small>
                                        <input
                                            type="number" min="0" max="23"
                                            className="settings-panel__input"
                                            value={userData.workSchedule?.workStart || 9}
                                            onChange={e => updateSchedule('workStart', +e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <small>End Hour</small>
                                        <input
                                            type="number" min="0" max="23"
                                            className="settings-panel__input"
                                            value={userData.workSchedule?.workEnd || 17}
                                            onChange={e => updateSchedule('workEnd', +e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            <button
                                className="primary-button settings-panel__save"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SettingsPanel;
