/**
 * A hook for managing dark mode
 * Integrates with localStorage and system preferences
 */

import { useState, useEffect } from 'react';
import useLocalState from './useLocalState';

/**
 * Options for the useDarkMode hook
 */
interface DarkModeOptions {
    /** Initial value to use if no preference is stored */
    defaultValue?: boolean;
    /** Key to use for storing the preference in localStorage */
    storageKey?: string;
    /** Class to apply to the root element in dark mode */
    darkClass?: string;
    /** Class to apply to the root element in light mode */
    lightClass?: string;
    /** Whether to use the system preference as the default */
    useSystemPreference?: boolean;
}

/**
 * Return type for the useDarkMode hook
 */
interface DarkModeReturn {
    /** Whether dark mode is currently enabled */
    isDarkMode: boolean;
    /** Toggle dark mode on/off */
    toggle: () => void;
    /** Enable dark mode */
    enable: () => void;
    /** Disable dark mode (enable light mode) */
    disable: () => void;
    /** Set dark mode to the system preference */
    useSystemPreference: () => void;
    /** Whether the system preference is for dark mode */
    systemPrefersDark: boolean;
}

/**
 * Hook for managing dark mode
 *
 * @param options Configuration options
 * @returns Object with current state and methods to change it
 */
export function useDarkMode({
    defaultValue = false,
    storageKey = 'darkMode',
    darkClass = 'dark',
    lightClass = 'light',
    useSystemPreference = true,
}: DarkModeOptions = {}): DarkModeReturn {
    // Check if the system prefers dark mode
    const getSystemPreference = (): boolean => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return defaultValue;
    };

    // Initialize with the stored value, system preference, or default
    const getInitialValue = (): boolean => {
        if (typeof window !== 'undefined') {
            // Check if there's a stored preference
            const storedValue = localStorage.getItem(storageKey);
            if (storedValue !== null) {
                return storedValue === 'true';
            }

            // Otherwise, use the system preference or default
            return useSystemPreference ? getSystemPreference() : defaultValue;
        }
        return defaultValue;
    };

    // State for the current mode
    const [isDarkMode, setDarkMode] = useLocalState<boolean>(storageKey, getInitialValue());

    // State for tracking the system preference
    const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(getSystemPreference());

    // Toggle between dark and light mode
    const toggle = (): void => {
        setDarkMode(prevState => !prevState);
    };

    // Enable dark mode
    const enable = (): void => {
        setDarkMode(true);
    };

    // Disable dark mode (enable light mode)
    const disable = (): void => {
        setDarkMode(false);
    };

    // Set the mode to the system preference
    const usePreference = (): void => {
        setDarkMode(systemPrefersDark);
    };

    // Listen for changes to the system preference
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (event: MediaQueryListEvent): void => {
            setSystemPrefersDark(event.matches);
        };

        // Set up the event listener
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // Older browsers support the deprecated addListener method
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mediaQuery as any).addListener(handleChange);
        }

        // Clean up the event listener
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                // Older browsers support the deprecated removeListener method
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (mediaQuery as any).removeListener(handleChange);
            }
        };
    }, []);

    // Apply the appropriate class to the root element
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add(darkClass);
            root.classList.remove(lightClass);
        } else {
            root.classList.add(lightClass);
            root.classList.remove(darkClass);
        }
    }, [isDarkMode, darkClass, lightClass]);

    return {
        isDarkMode,
        toggle,
        enable,
        disable,
        useSystemPreference: usePreference,
        systemPrefersDark,
    };
}

export default useDarkMode;