'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * A wrapper around useState that prevents infinite update loops
 * by limiting how frequently state updates can occur
 */
export function useStateWithSafeUpdates<T>(initialState: T | (() => T)) {
    const [state, setState] = useState<T>(initialState);
    const isUpdatingRef = useRef(false);
    const pendingUpdateRef = useRef<T | null>(null);

    // Clean up the isUpdating flag after each render cycle
    useEffect(() => {
        const timeout = setTimeout(() => {
            isUpdatingRef.current = false;

            // Apply any pending updates that were skipped
            if (pendingUpdateRef.current !== null) {
                const pendingValue = pendingUpdateRef.current;
                pendingUpdateRef.current = null;
                setState(pendingValue);
            }
        }, 0);

        return () => clearTimeout(timeout);
    });

    const setSafeState = useCallback((value: T | ((prevState: T) => T)) => {
        // If we're already updating, store this update to apply later
        if (isUpdatingRef.current) {
            pendingUpdateRef.current = typeof value === 'function'
                ? (value as ((prevState: T) => T))(state)
                : value;
            return;
        }

        // Mark that we're updating to prevent rapid consecutive updates
        isUpdatingRef.current = true;
        setState(value);
    }, [state]);

    return [state, setSafeState] as const;
}

/**
 * A hook that helps prevent infinite loops in useEffect by
 * ensuring the effect only runs once per render cycle
 */
export function useSafeEffect(
    effect: () => void | (() => void),
    deps: React.DependencyList
) {
    const renderCountRef = useRef(0);

    useEffect(() => {
        // Skip first render to prevent initial effect from causing loop
        if (renderCountRef.current === 0) {
            renderCountRef.current++;
            return;
        }

        // Only run the effect once per dependency change
        const cleanup = effect();
        renderCountRef.current++;

        return cleanup;
    }, deps);
}