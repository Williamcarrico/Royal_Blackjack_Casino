'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error boundary specifically designed to catch and handle
 * "Maximum update depth exceeded" errors from Radix UI components
 */
class RadixErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Check if this is a maximum update depth error
        const isMaxUpdateDepthError = error.message.includes('Maximum update depth exceeded');

        console.error(
            `RadixErrorBoundary caught an error: ${isMaxUpdateDepthError ? 'Maximum update depth exceeded' : error.message}`,
            errorInfo
        );

        this.setState({
            error,
            errorInfo
        });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Check if it's the specific error we're looking for
            const isMaxUpdateDepthError = this.state.error?.message.includes('Maximum update depth exceeded');

            // Use provided fallback or default fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive">
                    <h2 className="text-lg font-medium mb-2">
                        {isMaxUpdateDepthError
                            ? 'UI Component Error: Infinite Update Loop'
                            : 'Something went wrong'}
                    </h2>
                    {isMaxUpdateDepthError && (
                        <p className="text-sm mb-4">
                            A Radix UI component encountered an infinite update loop. The component has been
                            prevented from crashing your application.
                        </p>
                    )}
                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        className="px-3 py-1 text-sm rounded-md bg-background border hover:bg-accent"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default RadixErrorBoundary;