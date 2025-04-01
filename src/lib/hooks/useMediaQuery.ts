/**
 * A hook for responding to media queries
 * Useful for conditionally rendering components based on screen size
 */

import { useState, useEffect } from 'react';

/**
 * Returns whether the current viewport matches the given media query
 *
 * @param query The media query to check, e.g. '(min-width: 768px)'
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
    // SSR check - default to false on the server
    const getMatches = (): boolean => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    };

    // State to track whether the media query matches
    const [matches, setMatches] = useState<boolean>(getMatches());

    // Update matches when the media query changes
    useEffect(() => {
        // Get the initial value
        setMatches(getMatches());

        // Create a media query list to watch for changes
        const mediaQuery = window.matchMedia(query);

        // Define a handler for when the match state changes
        const handleChange = (): void => {
            setMatches(mediaQuery.matches);
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
    }, [query]);

    return matches;
}

// Predefined media queries for common breakpoints
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 639px)');
export const useIsTablet = (): boolean => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');
export const useIsDarkMode = (): boolean => useMediaQuery('(prefers-color-scheme: dark)');

export default useMediaQuery;