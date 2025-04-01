/**
 * A hook for managing state that persists in localStorage
 * Useful for preserving UI state between sessions
 */

import { useState, useEffect } from 'react';

type SetStateAction<T> = T | ((prevState: T) => T);
type SetLocalState<T> = (action: SetStateAction<T>) => void;

/**
 * Creates a state value that syncs with localStorage
 *
 * @param key The localStorage key to use
 * @param initialValue The initial state value if none exists in localStorage
 * @param serialize Custom serialization function (defaults to JSON.stringify)
 * @param deserialize Custom deserialization function (defaults to JSON.parse)
 * @returns A tuple of [state, setState] similar to useState
 */
export function useLocalState<T>(
    key: string,
    initialValue: T,
    serialize: (value: T) => string = JSON.stringify,
    deserialize: (value: string) => T = JSON.parse
): [T, SetLocalState<T>] {
    // Create a state value that starts with the initial value
    const [state, setState] = useState<T>(() => {
        // Only run on the client side
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            // Try to get the value from localStorage
            const item = window.localStorage.getItem(key);
            // Return the parsed value if it exists, otherwise use initialValue
            return item ? deserialize(item) : initialValue;
        } catch (error) {
            // If there's an error reading from localStorage, use initialValue
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage when the state changes
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            // Store the serialized state in localStorage
            window.localStorage.setItem(key, serialize(state));
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, state, serialize]);

    return [state, setState];
}

export default useLocalState;