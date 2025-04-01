/**
 * A hook for setting up an interval that cleans up when the component unmounts
 * Useful for polling or animations
 */

import { useEffect, useRef } from 'react';

/**
 * Sets up an interval that is properly cleaned up when the component unmounts
 *
 * @param callback The function to call on each interval
 * @param delay The delay in milliseconds between each call, or null to pause
 */
export function useInterval(callback: () => void, delay: number | null): void {
    // Store the callback in a ref so we can update it without resetting the interval
    const savedCallback = useRef<() => void>(callback);

    // Update the saved callback when it changes
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        // Don't set up the interval if delay is null
        if (delay === null) {
            return;
        }

        // Create an interval that calls the latest callback
        const id = setInterval(() => {
            savedCallback.current();
        }, delay);

        // Clean up the interval when the component unmounts or delay changes
        return () => {
            clearInterval(id);
        };
    }, [delay]);
}

export default useInterval;