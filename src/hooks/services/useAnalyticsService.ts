/**
 * Hook for using the Analytics service with React
 */
import { useCallback, useEffect, useRef } from 'react';
import { useService, getTypedService } from './useService';
import EventTracker, { EventCategory, EventName, EventProperties } from '../../services/analytics/eventTracker';
import { useRouter } from 'next/router';

export default function useAnalyticsService() {
    const {
        service: eventTracker,
        isLoading: serviceLoading,
        error: serviceError
    } = useService<EventTracker>('eventTracker');

    const router = useRouter();
    const previousPathRef = useRef<string>('');

    // Track page views
    useEffect(() => {
        if (!eventTracker || serviceLoading) {
            return;
        }

        const handleRouteChange = (url: string) => {
            const previousPath = previousPathRef.current;
            previousPathRef.current = url;

            eventTracker.trackPageView(url, previousPath);
        };

        // Track initial page view
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search;
            handleRouteChange(currentPath);
        }

        // Setup router events for tracking
        router.events.on('routeChangeComplete', handleRouteChange);

        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [eventTracker, serviceLoading, router]);

    /**
     * Track a custom event
     */
    const trackEvent = useCallback((
        category: EventCategory,
        name: EventName,
        properties?: EventProperties
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.track(category, name, properties);
    }, [eventTracker]);

    /**
     * Track a button click
     */
    const trackButtonClick = useCallback((
        buttonId: string,
        buttonText?: string
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.trackButtonClick(buttonId, buttonText);
    }, [eventTracker]);

    /**
     * Track a game action
     */
    const trackGameAction = useCallback((
        action: string,
        gameId: string,
        handId?: string,
        amount?: number
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.trackGameAction(action, gameId, handId, amount);
    }, [eventTracker]);

    /**
     * Track a bet
     */
    const trackBet = useCallback((
        gameId: string,
        amount: number,
        betType: string,
        handId?: string
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.trackBet(gameId, amount, betType, handId);
    }, [eventTracker]);

    /**
     * Track an error
     */
    const trackError = useCallback((
        errorType: string,
        errorMessage: string,
        errorStack?: string
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.trackError(errorType, errorMessage, errorStack);
    }, [eventTracker]);

    /**
     * Track a performance metric
     */
    const trackPerformance = useCallback((
        metricName: string,
        value: number,
        context?: EventProperties
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.trackPerformance(metricName, value, context);
    }, [eventTracker]);

    /**
     * Set the user ID for analytics
     */
    const setUserId = useCallback((userId: string) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.setUserId(userId);
    }, [eventTracker]);

    /**
     * Generate a new analytics session
     */
    const newSession = useCallback(() => {
        if (!eventTracker) {
            return '';
        }

        return eventTracker.newSession();
    }, [eventTracker]);

    /**
     * Get the current session ID
     */
    const getSessionId = useCallback(() => {
        if (!eventTracker) {
            return '';
        }

        return eventTracker.getSessionId();
    }, [eventTracker]);

    /**
     * Set the endpoint for analytics data
     */
    const setEndpoint = useCallback((endpoint: string) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.setEndpoint(endpoint);
    }, [eventTracker]);

    /**
     * Set debug mode
     */
    const setDebugMode = useCallback((enabled: boolean) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.setDebugMode(enabled);
    }, [eventTracker]);

    /**
     * Manually flush events to the server
     */
    const flushEvents = useCallback(async () => {
        if (!eventTracker) {
            return;
        }

        return eventTracker.flush();
    }, [eventTracker]);

    /**
     * Get pending event count
     */
    const getPendingEventCount = useCallback(() => {
        if (!eventTracker) {
            return 0;
        }

        return eventTracker.getPendingEventCount();
    }, [eventTracker]);

    /**
     * Clear all pending events
     */
    const clearEvents = useCallback(() => {
        if (!eventTracker) {
            return;
        }

        eventTracker.clearEvents();
    }, [eventTracker]);

    /**
     * Utility to track React error boundaries
     */
    const errorBoundaryHandler = useCallback((
        error: Error,
        errorInfo: { componentStack: string }
    ) => {
        if (!eventTracker) {
            return;
        }

        eventTracker.trackError(
            'react_error_boundary',
            error.message,
            `${error.stack}\nComponent stack: ${errorInfo.componentStack}`
        );
    }, [eventTracker]);

    return {
        service: getTypedService<EventTracker>(eventTracker),
        isLoading: serviceLoading,
        error: serviceError,
        trackEvent,
        trackButtonClick,
        trackGameAction,
        trackBet,
        trackError,
        trackPerformance,
        setUserId,
        newSession,
        getSessionId,
        setEndpoint,
        setDebugMode,
        flushEvents,
        getPendingEventCount,
        clearEvents,
        errorBoundaryHandler
    };
}