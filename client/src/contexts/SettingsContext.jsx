import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // Initialize from localStorage or defaults
    const [timeFormat, setTimeFormat] = useState(() => {
        return localStorage.getItem('chronex-time-format') || '12h';
    });
    
    const [mapProjection, setMapProjection] = useState(() => {
        return localStorage.getItem('chronex-map-projection') || 'mercator';
    });

    // Persist changes to localStorage
    useEffect(() => {
        localStorage.setItem('chronex-time-format', timeFormat);
    }, [timeFormat]);

    useEffect(() => {
        localStorage.setItem('chronex-map-projection', mapProjection);
    }, [mapProjection]);

    const value = {
        timeFormat,
        setTimeFormat,
        mapProjection,
        setMapProjection
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export default SettingsContext;
