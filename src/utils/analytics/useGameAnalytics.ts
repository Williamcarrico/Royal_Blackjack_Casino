'use client';

/**
 * Hook for tracking and analyzing game-specific analytics
 */
import { useCallback } from 'react';
import { Bet } from '@/types/betTypes';
import { GameAction, GameStatistics } from '@/types/gameTypes';
import { useAnalyticsStore } from './analyticsStore';
import { Hand, HandAction } from '@/types/handTypes';

interface ExtendedHand extends Hand {
    playerId?: string;
    initialValue?: number;
    dealerUpCard?: {
        rank: string;
        suit: string;
        value: number;
    };
    lastAction?: HandAction;
    isBusted?: boolean;
}

interface HeatMapEntry {
    playerValue: number;
    dealerValue: number;
    action: HandAction;
    result: string;
    count: number;
}

/**
 * Hook for tracking and analyzing game-specific data
 */
export function useGameAnalytics() {
    // Get state and actions from analytics store
    const {
        gamesPlayed,
        handsPlayed,
        totalWagered,
        totalWon,
        netProfit,
        recordGamePlayed,
        recordHand,
        recordBet,
        recordGameAction,
        getHeatMapAnalysis,
        exportAnalytics,
        resetStatistics,
        handAnalytics
    } = useAnalyticsStore();

    /**
     * Record a completed game
     */
    const trackGame = useCallback((gameResult: GameStatistics) => {
        recordGamePlayed(gameResult);
    }, [recordGamePlayed]);

    /**
     * Record a hand result
     */
    const trackHand = useCallback((
        hand: ExtendedHand,
        result: string,
        profit: number,
        wasOptimalPlay: boolean = true,
        optimalAction?: HandAction
    ) => {
        recordHand(hand, result, profit, wasOptimalPlay, optimalAction);
    }, [recordHand]);

    /**
     * Record a bet
     */
    const trackBet = useCallback((bet: Bet) => {
        recordBet(bet);
    }, [recordBet]);

    /**
     * Record a game action
     */
    const trackAction = useCallback((action: GameAction) => {
        recordGameAction(action);
    }, [recordGameAction]);

    /**
     * Get strategy heat map data
     */
    const getHeatMap = useCallback((): HeatMapEntry[] => {
        return getHeatMapAnalysis();
    }, [getHeatMapAnalysis]);

    /**
     * Get total game statistics
     */
    const getGameStats = useCallback(() => {
        return {
            gamesPlayed,
            handsPlayed,
            totalWagered,
            totalWon,
            netProfit,
            roi: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0
        };
    }, [gamesPlayed, handsPlayed, totalWagered, totalWon, netProfit]);

    /**
     * Get recent hands history
     */
    const getRecentHands = useCallback(() => {
        return handAnalytics.slice(0, 10);
    }, [handAnalytics]);

    /**
     * Reset all game statistics
     */
    const resetAllStats = useCallback(() => {
        resetStatistics();
    }, [resetStatistics]);

    /**
     * Export all analytics data
     */
    const exportData = useCallback(() => {
        return exportAnalytics();
    }, [exportAnalytics]);

    return {
        // Core tracking methods
        trackGame,
        trackHand,
        trackBet,
        trackAction,

        // Analysis methods
        getHeatMap,
        getGameStats,
        getRecentHands,

        // Utility methods
        resetAllStats,
        exportData
    };
}

export default useGameAnalytics;