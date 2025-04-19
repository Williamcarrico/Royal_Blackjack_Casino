'use client';

/**
 * Hook for managing session-specific analytics
 */
import { useCallback, useMemo } from 'react';
import { useAnalyticsStore } from './analyticsStore';

interface SessionMetrics {
    duration: number;
    handsPerHour: number;
    profitPerHour: number;
    averageBet: number;
    winRate?: number;
}

interface SessionDetails {
    id: string;
    startTime: Date;
    endTime?: Date;
    initialBalance: number;
    finalBalance?: number;
    handsPlayed: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
}

/**
 * Hook for managing and analyzing game sessions
 */
export function useSessionAnalytics(sessionId?: string) {
    // Get state and actions from analytics store
    const {
        currentSession,
        sessions,
        startSession,
        endSession,
        getSessionAnalysis,
    } = useAnalyticsStore();
    const sessionCount = sessions.length;

    /**
     * Start a new analytics session
     */
    const startNewSession = useCallback((initialBalance: number) => {
        startSession(initialBalance);
    }, [startSession]);

    /**
     * End the current analytics session
     */
    const endCurrentSession = useCallback((finalBalance: number) => {
        endSession(finalBalance);
    }, [endSession]);

    /**
     * Get the current session (if active)
     */
    const getCurrentSession = useMemo(() => {
        return currentSession;
    }, [currentSession]);

    /**
     * Get session metrics (for current or specified session)
     */
    const getSessionMetrics = useCallback((): SessionMetrics | null => {
        const analysis = getSessionAnalysis(sessionId);
        return analysis?.metrics || null;
    }, [getSessionAnalysis, sessionId]);

    /**
     * Get session details (for current or specified session)
     */
    const getSessionDetails = useCallback((): SessionDetails | null => {
        const analysis = getSessionAnalysis(sessionId);
        if (!analysis?.session) return null;

        const {
            id,
            startTime,
            endTime,
            initialBalance,
            finalBalance,
            handsPlayed,
            totalWagered,
            totalWon,
            netProfit
        } = analysis.session;

        return {
            id,
            startTime,
            endTime,
            initialBalance,
            finalBalance,
            handsPlayed,
            totalWagered,
            totalWon,
            netProfit
        };
    }, [getSessionAnalysis, sessionId]);

    /**
     * Get all saved sessions
     */
    const getAllSessions = useMemo(() => {
        return sessions.map(session => ({
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration ?? 0,
            handsPlayed: session.handsPlayed,
            netProfit: session.netProfit
        }));
    }, [sessions]);

    /**
     * Check if a session is active
     */
    const isSessionActive = useMemo(() => {
        return !!currentSession;
    }, [currentSession]);

    /**
     * Get session stats for the specified timeframe
     */
    const getSessionTimeStats = useCallback((timeframe: 'daily' | 'weekly' | 'monthly' | 'all' = 'all') => {
        let filteredSessions = [...sessions];

        // Filter based on timeframe
        if (timeframe !== 'all') {
            const cutoff = new Date();

            if (timeframe === 'daily') {
                cutoff.setDate(cutoff.getDate() - 1);
            } else if (timeframe === 'weekly') {
                cutoff.setDate(cutoff.getDate() - 7);
            } else if (timeframe === 'monthly') {
                cutoff.setMonth(cutoff.getMonth() - 1);
            }

            filteredSessions = filteredSessions.filter(
                session => new Date(session.startTime) >= cutoff
            );
        }

        // Calculate aggregated stats
        const totalSessions = filteredSessions.length;
        const totalHands = filteredSessions.reduce((sum, s) => sum + s.handsPlayed, 0);
        const totalProfit = filteredSessions.reduce((sum, s) => sum + s.netProfit, 0);
        const totalDuration = filteredSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);

        // Calculate averages
        const avgSessionLength = totalSessions > 0 ? totalDuration / totalSessions : 0;
        const avgHandsPerSession = totalSessions > 0 ? totalHands / totalSessions : 0;
        const avgProfitPerSession = totalSessions > 0 ? totalProfit / totalSessions : 0;

        return {
            totalSessions,
            totalHands,
            totalProfit,
            totalDuration,
            avgSessionLength,
            avgHandsPerSession,
            avgProfitPerSession,
            timeframe
        };
    }, [sessions]);

    return {
        // Session management
        startNewSession,
        endCurrentSession,
        isSessionActive,
        currentSession: getCurrentSession,

        // Session analysis
        sessionMetrics: getSessionMetrics(),
        sessionDetails: getSessionDetails(),
        allSessions: getAllSessions,
        sessionTimeStats: getSessionTimeStats,
        sessionCount
    };
}

export default useSessionAnalytics;