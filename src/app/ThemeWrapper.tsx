'use client';

import { useTheme } from '@/lib/context/ThemeContext';
import { useEffect } from 'react';

/**
 * ThemeWrapper applies the theme to the HTML element based on ThemeContext
 * This is a client component that should be placed high in the component tree
 */
export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { isDarkMode } = useTheme();

    // Apply the theme to the document
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add('dark');
            root.classList.remove('light');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
    }, [isDarkMode]);

    return <>{children}</>;
}
