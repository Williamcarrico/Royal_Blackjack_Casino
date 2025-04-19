/**
 * A hook for debouncing a value
 * Useful for delaying updates when a value changes rapidly,
 * such as during user input
 */

import { useState, useEffect } from 'react';

/**
 * Creates a debounced version of a value that only updates
 * after the specified delay has passed without a new value
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes before the delay completes
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;