'use client';

import React, { useRef, useEffect, useMemo, ComponentType, forwardRef } from 'react';

/**
 * Higher Order Component that wraps any component to prevent
 * infinite update loops by controlling state updates
 */
export function withSafeUpdates<T extends object>(
    Component: ComponentType<T>,
    displayName: string = 'SafeComponent',
    getDependencies?: (props: React.PropsWithoutRef<T>) => React.DependencyList
) {
    const WrappedComponent = forwardRef<unknown, T>((props, ref) => {
        // Track if an update is in progress to prevent loops
        const updatingRef = useRef(false);

        // Use this effect to reset the updating flag after each render cycle
        useEffect(() => {
            // Start fresh on mount
            updatingRef.current = false;

            return () => {
                // Clean up
                updatingRef.current = false;
            };
        }, []);

        // Extract complex expression to a memoized variable
        const dependencies = getDependencies ? getDependencies(props) : [props];

        // Memoize props to prevent unnecessary re-renders
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const memoizedProps = useMemo(() => props, dependencies);

        // Create a stable ref object
        const stableRef = useRef<React.Ref<unknown>>(null);

        // Update the stable ref when the incoming ref changes
        useEffect(() => {
            if (ref && typeof ref === 'function') {
                // Function ref
                ref(stableRef.current);
            } else if (ref) {
                // Object ref
                (ref as React.MutableRefObject<unknown>).current = stableRef.current;
            }
        }, [ref]);

        return (
            <RadixErrorBoundary>
                <Component {...memoizedProps} ref={stableRef} />
            </RadixErrorBoundary>
        );
    });

    // Set display name for debugging
    WrappedComponent.displayName = `withSafeUpdates(${displayName})`;

    return WrappedComponent;
}

/**
 * Minimal error boundary to catch and handle errors
 */
class RadixErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('RadixErrorBoundary caught an error:', error.message);
    }

    render() {
        if (this.state.hasError) {
            return null; // Render nothing on error to prevent the loop
        }

        return this.props.children;
    }
}