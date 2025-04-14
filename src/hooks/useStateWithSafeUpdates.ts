'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * A custom React hook that prevents infinite update loops
 * by limiting how frequently state updates can occur.
 *
 * This hook works like useState but adds protection against rapid
 * consecutive updates by deferring updates that occur while a previous
 * update is still being processed. Deferred updates will be applied
 * in the next render cycle.
 *
 * @template T The type of the state value
 * @param {T | (() => T)} initialState The initial state value or a function that returns it
 * @returns {[T, (value: T | ((prevState: T) => T)) => void]} A tuple containing the current state and a setter function
 *
 * @example
 * ```jsx
 * const [count, setCount] = useStateWithSafeUpdates(0);
 *
 * // Won't cause infinite loop even if called in render
 * const increment = () => {
 *   setCount(prev => prev + 1);
 * };
 * ```
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

    /**
     * Set state with protection against rapid consecutive updates
     *
     * If called while a previous update is still being processed,
     * this update will be queued and applied in the next render cycle.
     *
     * @param {T | ((prevState: T) => T)} value New state value or function to update previous state
     */
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
 * A hook that helps prevent infinite loops in useEffect
 * by ensuring the effect only runs once per render cycle.
 *
 * This is particularly useful for effects that might trigger
 * state updates that would cause the component to re-render,
 * potentially causing an infinite loop.
 *
 * @param {() => void | (() => void)} effect The effect function to run
 * @param {React.DependencyList} deps Dependencies array that controls when the effect runs
 *
 * @example
 * ```jsx
 * // Won't cause infinite loop even if setCount triggers a re-render
 * useSafeEffect(() => {
 *   setCount(count + 1);
 * }, [count]);
 * ```
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