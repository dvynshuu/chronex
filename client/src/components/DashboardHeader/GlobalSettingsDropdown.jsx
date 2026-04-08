import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import './GlobalSettingsDropdown.css';

const GlobalSettingsDropdown = ({ isOpen }) => {
    const { timeFormat, setTimeFormat, mapProjection, setMapProjection } = useSettings();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="dropdown-panel global-settings-panel"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="dropdown-header">
                        <h3>Global Settings</h3>
                    </div>

                    <div className="settings-content">
                        <div className="setting-group">
                            <label>Time Format</label>
                            <div className="toggle-group">
                                <button 
                                    className={`toggle-btn ${timeFormat === '12h' ? 'active' : ''}`}
                                    onClick={() => setTimeFormat('12h')}
                                >12h</button>
                                <button 
                                    className={`toggle-btn ${timeFormat === '24h' ? 'active' : ''}`}
                                    onClick={() => setTimeFormat('24h')}
                                >24h</button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>Map Projection</label>
                            <select 
                                className="settings-select"
                                value={mapProjection}
                                onChange={(e) => setMapProjection(e.target.value)}
                            >
                                <option value="mercator">Mercator</option>
                                <option value="orthographic">Orthographic</option>
                                <option value="equirectangular">Equirectangular</option>
                                <option value="equalEarth">Equal Earth</option>
                            </select>
                        </div>
                    </div>

                    <div className="dropdown-footer">
                        <p className="settings-hint">Changes are applied immediately.</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalSettingsDropdown;
