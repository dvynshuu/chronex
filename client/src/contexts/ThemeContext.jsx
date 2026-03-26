import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('chronex-theme', 'dark');
    }, []);

    const toggleTheme = () => {};

    return (
        <ThemeContext.Provider value={{ theme: 'dark', setTheme: () => {}, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};

export default ThemeContext;
