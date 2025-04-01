/**
 * A hook for throttling a value
 * Useful for limiting the rate at which a value can change,
 * such as during continuous events like scrolling
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Creates a throttled version of a value that only updates
 * at most once per specified interval
 *
 * @param value The value to throttle
 * @param limit The minimum time between updates in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number = 200): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastUpdated = useRef<number>(0);

    useEffect(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdated.current;

        // If enough time has passed since the last update,
        // update the throttled value immediately
        if (timeSinceLastUpdate >= limit) {
            setThrottledValue(value);
            lastUpdated.current = now;
        } else {
            // Otherwise, schedule an update for when the limit has passed
            const timerId = setTimeout(() => {
                setThrottledValue(value);
                lastUpdated.current = Date.now();
            }, limit - timeSinceLastUpdate);

            // Clean up the timer if the value changes before the scheduled update
            return () => {
                clearTimeout(timerId);
            };
        }
    }, [value, limit]);

    return throttledValue;
}

export default useThrottle;