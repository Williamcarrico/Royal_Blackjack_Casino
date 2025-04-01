'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { Theme } from '@/store/enhancedSettingsStore';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get the theme from settings store
    const storeTheme = useEnhancedSettingsStore(state => state.theme);
    const setStoreTheme = useEnhancedSettingsStore(state => state.setTheme);

    // Local state to handle system theme detection
    const [resolvedTheme, setResolvedTheme] = useState<Theme>(storeTheme);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    // Effect to handle system theme changes and resolve the actual theme
    useEffect(() => {
        const updateTheme = () => {
            if (storeTheme === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDarkMode(systemPrefersDark);
                setResolvedTheme(systemPrefersDark ? 'dark' : 'light');
            } else {
                setIsDarkMode(storeTheme === 'dark');
                setResolvedTheme(storeTheme);
            }
        };

        updateTheme();

        // Listen for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => updateTheme();

        // Modern browsers support addEventListener
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [storeTheme]);

    // Effect to apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Toggle between light and dark (ignoring system)
    const toggleTheme = () => {
        const newTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setStoreTheme(newTheme);
    };

    // Create context value
    const contextValue: ThemeContextType = {
        theme: resolvedTheme,
        setTheme: setStoreTheme,
        toggleTheme,
        isDarkMode
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
};