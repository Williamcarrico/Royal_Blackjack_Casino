/**
 * A hook for tracking the previous value of a variable
 * Useful for comparing current and previous values in effects
 */

import { useRef, useEffect } from 'react';

/**
 * Returns the previous value of a variable after each render
 *
 * @param value The current value
 * @returns The value from the previous render
 */
export function usePrevious<T>(value: T): T | undefined {
    // Store the previous value in a ref
    const ref = useRef<T>();

    // Update the ref after each render
    useEffect(() => {
        ref.current = value;
    }, [value]);

    // Return the value from before this render
    return ref.current;
}

export default usePrevious;