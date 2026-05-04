import React from 'react';
import { useSettingsStore } from '../store/useStore';

/**
 * LEGACY BRIDGE: This file allows components still using the legacy useSettings hook
 * to continue functioning by bridging to the new Zustand useSettingsStore.
 * 
 * TODO: Completely remove this file and update all imports to use useSettingsStore directly.
 */

export const SettingsProvider = ({ children }) => {
    return <>{children}</>;
};

export const useSettings = () => {
    const settings = useSettingsStore();
    return settings;
};

// Default export for compatibility
const SettingsContext = {
    Provider: SettingsProvider,
    Consumer: ({ children }) => children(useSettingsStore())
};

export default SettingsContext;
