'use client';

/**
 * Hook for managing player-specific analytics
 */
import { useCallback, useMemo } from 'react';
import { useAnalyticsStore } from './analyticsStore';
import { HandAction } from '@/types/handTypes';

interface SkillMetric {
    category: string;
    score: number;
    level: string;
}

interface PlayerPerformance {
    decisionAccuracy: number;
    betSizing: number;
    consistencyScore: number;
    riskManagement: number;
    advantagePlayScore: number;
}

interface ActionStatistics {
    action: HandAction;
    count: number;
    successCount: number;
    successRate: number;
    isOptimal: number;
}

/**
 * Hook for managing and analyzing player performance
 */
export function usePlayerAnalytics() {
    // Get state and actions from analytics store
    const {
        handsPlayed,
        handsWon,
        handsLost,
        handsPushed,
        blackjacks,
        performanceMetrics,
        winRate,
        blackjackRate,
        getPerformanceReport,
        updatePlayerPerformanceMetrics,
        updatePerformanceMetrics
    } = useAnalyticsStore();

    /**
     * Get player win rate statistics
     */
    const getWinRateStats = useMemo(() => {
        return {
            winRate,
            handsPlayed,
            handsWon,
            handsLost,
            handsPushed,
            blackjacks,
            blackjackRate,
            weeklyTrend: 0.05 // Placeholder - would calculate from history
        };
    }, [winRate, handsPlayed, handsWon, handsLost, handsPushed, blackjacks, blackjackRate]);

    /**
     * Get player skill metrics
     */
    const getSkillMetrics = useMemo((): SkillMetric[] => {
        const report = getPerformanceReport();
        return report.skillMetrics;
    }, [getPerformanceReport]);

    /**
     * Get action success statistics
     */
    const getActionStats = useMemo((): ActionStatistics[] => {
        return Object.entries(performanceMetrics.actionSuccess).map(([action, data]) => ({
            action: action as HandAction,
            count: data.count,
            successCount: data.success,
            successRate: data.count > 0 ? data.success / data.count : 0,
            isOptimal: 0.8 // Placeholder - would calculate from history
        }));
    }, [performanceMetrics.actionSuccess]);

    /**
     * Get player performance metrics
     */
    const getPlayerPerformance = useMemo((): PlayerPerformance => {
        return performanceMetrics.playerPerformanceMetrics;
    }, [performanceMetrics.playerPerformanceMetrics]);

    /**
     * Get win rate by dealer up card
     */
    const getWinRateByDealerCard = useMemo(() => {
        return performanceMetrics.winRateByDealer;
    }, [performanceMetrics.winRateByDealer]);

    /**
     * Get win rate by initial hand value
     */
    const getWinRateByHandValue = useMemo(() => {
        return performanceMetrics.winRateByHandValue;
    }, [performanceMetrics.winRateByHandValue]);

    /**
     * Get player streak information
     */
    const getStreakInfo = useMemo(() => {
        return performanceMetrics.streaks;
    }, [performanceMetrics.streaks]);

    /**
     * Get player level
     */
    const getPlayerLevel = useMemo(() => {
        const report = getPerformanceReport();
        return report.playerLevel;
    }, [getPerformanceReport]);

    /**
     * Update player performance metrics
     */
    const updatePerformance = useCallback((metrics: Partial<PlayerPerformance>) => {
        updatePlayerPerformanceMetrics(metrics);
    }, [updatePlayerPerformanceMetrics]);

    /**
     * Update player skill metrics
     */
    const updateSkills = useCallback((
        metrics: Partial<{
            basicStrategy: number;
            cardCounting: number;
            bankrollManagement: number;
            disciplineScore: number;
            overallSkill: number;
        }>
    ) => {
        updatePerformanceMetrics(metrics);
    }, [updatePerformanceMetrics]);

    /**
     * Get a performance summary
     */
    const getPerformanceSummary = useCallback(() => {
        const report = getPerformanceReport();

        return {
            playerLevel: report.playerLevel,
            overallScore: performanceMetrics.skillMetrics.overallSkill,
            decisionAccuracy: performanceMetrics.playerPerformanceMetrics.decisionAccuracy,
            expectedValue: report.expectedValue,
            netProfit: report.totalProfit,
            streaks: report.streaks
        };
    }, [getPerformanceReport, performanceMetrics]);

    return {
        // Player statistics
        winRateStats: getWinRateStats,
        skillMetrics: getSkillMetrics,
        actionStats: getActionStats,
        playerPerformance: getPlayerPerformance,
        winRateByDealerCard: getWinRateByDealerCard,
        winRateByHandValue: getWinRateByHandValue,
        streakInfo: getStreakInfo,
        playerLevel: getPlayerLevel,

        // Summary functions
        performanceSummary: getPerformanceSummary(),

        // Update functions
        updatePerformance,
        updateSkills
    };
}

export default usePlayerAnalytics;