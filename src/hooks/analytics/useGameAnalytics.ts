/**
 * Hook for tracking Blackjack game statistics and analytics
 */
import { useCallback, useMemo, useState } from 'react';
import { GameOptions } from '../../types/gameTypes';
// Create a new interface for player type since the import is missing
interface Player {
    id: string;
    name: string;
    balance: number;
}

import { Hand, HandResult } from '../../types/handTypes';
import { Bet } from '../../types/betTypes';

// Analytics store state type needed by AnalyticsDashboard
export interface AnalyticsStoreState {
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
    busts: number;
    blackjackRate: number;
    doublesWon: number;
    splitsWon: number;
    totalWagered: number;
    totalWon: number;
    averageBet: number;
    netProfit: number;
    sessions: AnalyticsSession[];
    performanceMetrics: {
        actionSuccess: Record<string, ActionSuccessData>;
    };
    resetStatistics: () => void;
    exportAnalytics: () => Record<string, unknown>;
}

// Types needed for AnalyticsDashboard
export interface WinRateData {
    winRate: number;
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
    weeklyTrend?: number;
}

export interface PerformanceMetricsType {
    totalProfit: number;
    recentTrend?: number;
    streaks: {
        longestWinStreak: number;
        currentWinStreak: number;
        currentLoseStreak: number;
        longestLoseStreak: number;
    };
    bankrollStatus?: {
        status: string;
    };
    skillMetrics: SkillMetric[];
    playerLevel: string;
    expectedValue: number;
    actionSuccess: Record<string, ActionSuccessData>;
}

export interface SkillMetric {
    category: string;
    score: number;
    level: string;
}

export interface AnalyticsSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    handsPlayed: number;
    roundsPlayed: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    gameActions: Record<string, unknown>[];
    initialBalance: number;
    finalBalance?: number;
}

export interface Session {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    handsPlayed: number;
    netProfit: number;
    averageBet?: number;
}

export interface SessionMetrics {
    session?: {
        id: string;
        startTime: Date;
        handsPlayed: number;
        netProfit: number;
    };
    metrics?: {
        duration: number;
        averageBet: number;
        handsPerHour: number;
        profitPerHour: number;
        winRate?: number;
    };
}

export interface HeatMapEntry {
    playerValue: number;
    dealerCard: number;
    action: string;
    result: string;
    count: number;
}

export interface ActionSuccessData {
    success: number;
    count: number;
    optimal?: number;
}

export interface AggregatedHeatMapData {
    playerValue: number;
    action: string;
    wins: number;
    losses: number;
    total: number;
    winRate: number;
}

export interface GameSession {
    id: string;
    startTime: number;
    endTime?: number;
    initialBalance: number;
    finalBalance?: number;
    handsPlayed: number;
    roundsPlayed: number;
    totalBetAmount: number;
    totalWinAmount: number;
    netProfit: number;
    winRate: number;
    gameOptions: GameOptions;
}

// Extend the Hand interface for our needs
interface ExtendedHand extends Hand {
    playerId?: string;
    betId?: string;
}

export interface RoundAnalytics {
    round: number;
    timestamp: number;
    playerHands: ExtendedHand[];
    dealerHand: Hand;
    bets: Bet[];
    results: HandResult[];
    netChange: number;
}

export interface ActionAnalytics {
    action: string;
    count: number;
    successCount: number;
    successRate: number;
}

export interface PlayerAnalytics {
    playerId: string;
    name: string;
    handsPlayed: number;
    handsWon: number;
    winRate: number;
    totalBet: number;
    totalWon: number;
    netProfit: number;
    streaks: {
        currentStreak: number;
        longestWinStreak: number;
        longestLossStreak: number;
    };
}

/**
 * Hook for tracking and analyzing Blackjack game statistics
 */
export function useGameAnalytics() {
    // Session tracking
    const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
    const [sessions, setSessions] = useState<GameSession[]>([]);

    // Round tracking
    const [rounds, setRounds] = useState<RoundAnalytics[]>([]);

    // Action tracking
    const [actions, setActions] = useState<Record<string, ActionAnalytics>>({});

    // Player tracking
    const [playerStats, setPlayerStats] = useState<Record<string, PlayerAnalytics>>({});

    // Outcome tracking - include 'pending' in the outcomes
    const [outcomes, setOutcomes] = useState<Record<HandResult, number>>({
        'win': 0,
        'loss': 0,
        'push': 0,
        'blackjack': 0,
        'surrender': 0,
        'insurance': 0,
        'pending': 0
    });

    /**
     * Start a new game session
     */
    const startSession = useCallback((
        players: Player[],
        gameOptions: GameOptions
    ): string => {
        const sessionId = `session-${Date.now()}`;

        // Calculate initial balance of all players
        const initialBalance = players.reduce((sum, player) => sum + player.balance, 0);

        // Create new session
        const newSession: GameSession = {
            id: sessionId,
            startTime: Date.now(),
            initialBalance,
            handsPlayed: 0,
            roundsPlayed: 0,
            totalBetAmount: 0,
            totalWinAmount: 0,
            netProfit: 0,
            winRate: 0,
            gameOptions
        };

        setCurrentSession(newSession);

        // Reset all analytics for the new session
        setRounds([]);
        setActions({});
        setPlayerStats({});
        setOutcomes({
            'win': 0,
            'loss': 0,
            'push': 0,
            'blackjack': 0,
            'surrender': 0,
            'insurance': 0,
            'pending': 0
        });

        return sessionId;
    }, []);

    /**
     * End the current game session
     */
    const endSession = useCallback((players: Player[]): GameSession | null => {
        if (!currentSession) {
            return null;
        }

        // Calculate final balance
        const finalBalance = players.reduce((sum, player) => sum + player.balance, 0);

        // Update session with final stats
        const completedSession: GameSession = {
            ...currentSession,
            endTime: Date.now(),
            finalBalance,
            netProfit: finalBalance - currentSession.initialBalance,
            winRate: currentSession.handsPlayed > 0
                ? (outcomes.win + outcomes.blackjack) / currentSession.handsPlayed
                : 0
        };

        // Add to sessions history
        setSessions(prev => [...prev, completedSession]);

        // Clear current session
        setCurrentSession(null);

        return completedSession;
    }, [currentSession, outcomes]);

    /**
     * Track a completed round
     */
    const trackRound = useCallback((
        roundNumber: number,
        playerHands: ExtendedHand[],
        dealerHand: Hand,
        bets: Bet[]
    ): void => {
        if (!currentSession) {
            return;
        }

        // Extract results
        const results = playerHands.map(hand => hand.result || 'loss');

        // Calculate net change
        const netChange = bets.reduce((sum, bet) => {
            if (bet.status === 'won' && bet.payout) {
                return sum + bet.payout - bet.amount;
            } else if (bet.status === 'push') {
                return sum;
            } else {
                return sum - bet.amount;
            }
        }, 0);

        // Create round analytics
        const roundData: RoundAnalytics = {
            round: roundNumber,
            timestamp: Date.now(),
            playerHands,
            dealerHand,
            bets,
            results,
            netChange
        };

        // Add to rounds
        setRounds(prev => [...prev, roundData]);

        // Update outcomes count
        const newOutcomes = { ...outcomes };
        results.forEach(result => {
            if (result) {
                newOutcomes[result]++;
            }
        });
        setOutcomes(newOutcomes);

        // Update session stats
        setCurrentSession(prev => {
            if (!prev) return null;

            const betAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
            const winAmount = bets.reduce((sum, bet) => {
                if (bet.status === 'won' && bet.payout) {
                    return sum + bet.payout;
                }
                return sum;
            }, 0);

            return {
                ...prev,
                handsPlayed: prev.handsPlayed + playerHands.length,
                roundsPlayed: prev.roundsPlayed + 1,
                totalBetAmount: prev.totalBetAmount + betAmount,
                totalWinAmount: prev.totalWinAmount + winAmount,
                netProfit: prev.netProfit + netChange
            };
        });

        // Update player stats
        playerHands.forEach(hand => {
            if (!hand.playerId) return;

            const bet = bets.find(b => b.id === hand.betId);
            if (!bet) return;

            const isWin = hand.result === 'win' || hand.result === 'blackjack';

            setPlayerStats(prev => {
                const playerStat = prev[hand.playerId!] || {
                    playerId: hand.playerId!,
                    name: hand.playerId!,
                    handsPlayed: 0,
                    handsWon: 0,
                    winRate: 0,
                    totalBet: 0,
                    totalWon: 0,
                    netProfit: 0,
                    streaks: {
                        currentStreak: 0,
                        longestWinStreak: 0,
                        longestLossStreak: 0
                    }
                };

                // Calculate streaks
                let currentStreak = playerStat.streaks.currentStreak;
                let longestWinStreak = playerStat.streaks.longestWinStreak;
                let longestLossStreak = playerStat.streaks.longestLossStreak;

                if (isWin) {
                    currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
                    longestWinStreak = Math.max(longestWinStreak, currentStreak);
                } else {
                    currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
                    longestLossStreak = Math.max(longestLossStreak, Math.abs(currentStreak));
                }

                // Calculate payout
                const payout = isWin ? (bet.payout || 0) : 0;
                const profit = payout - bet.amount;

                // Update player stats
                const updatedStat = {
                    ...playerStat,
                    handsPlayed: playerStat.handsPlayed + 1,
                    handsWon: playerStat.handsWon + (isWin ? 1 : 0),
                    winRate: (playerStat.handsWon + (isWin ? 1 : 0)) / (playerStat.handsPlayed + 1),
                    totalBet: playerStat.totalBet + bet.amount,
                    totalWon: playerStat.totalWon + payout,
                    netProfit: playerStat.netProfit + profit,
                    streaks: {
                        currentStreak,
                        longestWinStreak,
                        longestLossStreak
                    }
                };

                return {
                    ...prev,
                    [hand.playerId!]: updatedStat
                };
            });
        });
    }, [currentSession, outcomes]);

    /**
     * Track a player action
     */
    const trackAction = useCallback((
        action: string,
        isSuccessful: boolean = true
    ): void => {
        setActions(prev => {
            const actionStat = prev[action] || {
                action,
                count: 0,
                successCount: 0,
                successRate: 0
            };

            const updatedStat = {
                ...actionStat,
                count: actionStat.count + 1,
                successCount: actionStat.successCount + (isSuccessful ? 1 : 0),
                successRate: (actionStat.successCount + (isSuccessful ? 1 : 0)) / (actionStat.count + 1)
            };

            return {
                ...prev,
                [action]: updatedStat
            };
        });
    }, []);

    /**
     * Get session statistics
     */
    const getSessionStats = useCallback(() => {
        if (!currentSession) {
            return null;
        }

        return {
            ...currentSession,
            duration: currentSession.endTime
                ? (currentSession.endTime - currentSession.startTime) / 1000
                : (Date.now() - currentSession.startTime) / 1000,
            outcomesDistribution: {
                win: outcomes.win / currentSession.handsPlayed || 0,
                loss: outcomes.loss / currentSession.handsPlayed || 0,
                push: outcomes.push / currentSession.handsPlayed || 0,
                blackjack: outcomes.blackjack / currentSession.handsPlayed || 0,
                surrender: outcomes.surrender / currentSession.handsPlayed || 0,
                insurance: outcomes.insurance / currentSession.handsPlayed || 0,
                pending: outcomes.pending / currentSession.handsPlayed || 0
            },
            averageBet: currentSession.totalBetAmount / currentSession.handsPlayed || 0,
            roi: currentSession.totalBetAmount > 0
                ? (currentSession.netProfit / currentSession.totalBetAmount) * 100
                : 0
        };
    }, [currentSession, outcomes]);

    /**
     * Get all sessions history
     */
    const getSessionsHistory = useCallback(() => {
        return sessions;
    }, [sessions]);

    /**
     * Get player analytics
     */
    const getPlayerAnalytics = useCallback((playerId?: string) => {
        if (playerId) {
            return playerStats[playerId] || null;
        }

        return Object.values(playerStats);
    }, [playerStats]);

    /**
     * Get rounds history
     */
    const getRoundsHistory = useCallback(() => {
        return rounds;
    }, [rounds]);

    /**
     * Get action analytics
     */
    const getActionAnalytics = useCallback(() => {
        return Object.values(actions);
    }, [actions]);

    /**
     * Get outcome distribution
     */
    const getOutcomeDistribution = useCallback(() => {
        const total = Object.values(outcomes).reduce((sum, count) => sum + count, 0);

        if (total === 0) {
            return Object.keys(outcomes).reduce((acc, key) => {
                acc[key as HandResult] = 0;
                return acc;
            }, {} as Record<HandResult, number>);
        }

        return Object.keys(outcomes).reduce((acc, key) => {
            acc[key as HandResult] = outcomes[key as HandResult] / total;
            return acc;
        }, {} as Record<HandResult, number>);
    }, [outcomes]);

    /**
     * Get all-time statistics
     */
    const getAllTimeStats = useMemo(() => {
        const allSessions = [...sessions];
        if (currentSession) {
            allSessions.push(currentSession);
        }

        if (allSessions.length === 0) {
            return {
                totalSessions: 0,
                totalHandsPlayed: 0,
                totalRoundsPlayed: 0,
                totalBetAmount: 0,
                totalWinAmount: 0,
                netProfit: 0,
                winRate: 0,
                averageBet: 0,
                roi: 0
            };
        }

        const totalHandsPlayed = allSessions.reduce((sum, session) => sum + session.handsPlayed, 0);
        const totalRoundsPlayed = allSessions.reduce((sum, session) => sum + session.roundsPlayed, 0);
        const totalBetAmount = allSessions.reduce((sum, session) => sum + session.totalBetAmount, 0);
        const totalWinAmount = allSessions.reduce((sum, session) => sum + session.totalWinAmount, 0);
        const netProfit = allSessions.reduce((sum, session) => sum + session.netProfit, 0);

        return {
            totalSessions: allSessions.length,
            totalHandsPlayed,
            totalRoundsPlayed,
            totalBetAmount,
            totalWinAmount,
            netProfit,
            winRate: totalHandsPlayed > 0
                ? (outcomes.win + outcomes.blackjack) / totalHandsPlayed
                : 0,
            averageBet: totalHandsPlayed > 0
                ? totalBetAmount / totalHandsPlayed
                : 0,
            roi: totalBetAmount > 0
                ? (netProfit / totalBetAmount) * 100
                : 0
        };
    }, [sessions, currentSession, outcomes]);

    /**
     * Get recent trends
     */
    const getRecentTrends = useCallback((limit: number = 10) => {
        const recentRounds = rounds.slice(-limit);

        if (recentRounds.length === 0) {
            return {
                winningStreak: 0,
                profitTrend: 0,
                averageBet: 0,
                netProfit: 0
            };
        }

        // Calculate win streak
        let currentStreak = 0;
        for (let i = recentRounds.length - 1; i >= 0; i--) {
            const round = recentRounds[i];
            if (round) {
                const hasWin = round.results.some(result => result === 'win' || result === 'blackjack');

                if (hasWin) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate other trends
        const totalBet = recentRounds.reduce((sum, round) => {
            if (!round) return sum;
            return sum + round.bets.reduce((betSum, bet) => betSum + bet.amount, 0);
        }, 0);

        const netProfit = recentRounds.reduce((sum, round) => {
            if (!round) return sum;
            return sum + round.netChange;
        }, 0);

        const totalHands = recentRounds.reduce((sum, round) => {
            if (!round) return sum;
            return sum + round.playerHands.length;
        }, 0);

        // Calculate profit trend (positive or negative)
        const firstHalf = recentRounds.slice(0, Math.floor(recentRounds.length / 2));
        const secondHalf = recentRounds.slice(Math.floor(recentRounds.length / 2));

        const firstHalfProfit = firstHalf.reduce((sum, round) => {
            if (!round) return sum;
            return sum + round.netChange;
        }, 0);

        const secondHalfProfit = secondHalf.reduce((sum, round) => {
            if (!round) return sum;
            return sum + round.netChange;
        }, 0);

        const profitTrend = secondHalfProfit - firstHalfProfit;

        return {
            winningStreak: currentStreak,
            profitTrend,
            averageBet: totalHands > 0 ? totalBet / totalHands : 0,
            netProfit
        };
    }, [rounds]);

    /**
     * Export analytics data
     */
    const exportAnalytics = useCallback(() => {
        return {
            currentSession: getSessionStats(),
            sessions: getSessionsHistory(),
            players: getPlayerAnalytics(),
            rounds: getRoundsHistory(),
            actions: getActionAnalytics(),
            outcomes: getOutcomeDistribution(),
            allTime: getAllTimeStats,
            trends: getRecentTrends()
        };
    }, [
        getSessionStats,
        getSessionsHistory,
        getPlayerAnalytics,
        getRoundsHistory,
        getActionAnalytics,
        getOutcomeDistribution,
        getAllTimeStats,
        getRecentTrends
    ]);

    // Reset all statistics
    const resetStatistics = useCallback(() => {
        setSessions([]);
        setRounds([]);
        setActions({});
        setPlayerStats({});
        setOutcomes({
            'win': 0,
            'loss': 0,
            'push': 0,
            'blackjack': 0,
            'surrender': 0,
            'insurance': 0,
            'pending': 0
        });
    }, []);

    return {
        // Session management
        startSession,
        endSession,
        currentSession,

        // Tracking
        trackRound,
        trackAction,

        // Analytics
        getSessionStats,
        getSessionsHistory,
        getPlayerAnalytics,
        getRoundsHistory,
        getActionAnalytics,
        getOutcomeDistribution,
        getAllTimeStats,
        getRecentTrends,

        // Export
        exportAnalytics,

        // Reset
        resetStatistics
    };
}

/**
 * Hook to get win rate data
 */
export function useWinRate(): WinRateData {
    // In a real implementation, this would get data from useAnalyticsStore
    // This is a placeholder implementation based on what AnalyticsDashboard expects
    const analytics = useGameAnalytics();
    const stats = analytics.getAllTimeStats;

    return {
        winRate: stats.winRate || 0,
        handsPlayed: stats.totalHandsPlayed || 0,
        handsWon: stats.totalHandsPlayed * stats.winRate || 0,
        handsLost: stats.totalHandsPlayed * (1 - stats.winRate) || 0,
        handsPushed: 0, // This would come from actual data
        blackjacks: 0, // This would come from actual data
        weeklyTrend: 0.5 // This would be calculated from historical data
    };
}

/**
 * Hook to get performance metrics
 */
export function usePerformanceMetrics(): PerformanceMetricsType {
    // This is a placeholder implementation
    const analytics = useGameAnalytics();
    const stats = analytics.getAllTimeStats;
    const trends = analytics.getRecentTrends(10);

    // Sample skill metrics
    const skillMetrics: SkillMetric[] = [
        { category: 'Basic Strategy', score: 75, level: 'intermediate' },
        { category: 'Bankroll Management', score: 60, level: 'intermediate' },
        { category: 'Card Counting', score: 40, level: 'beginner' },
        { category: 'Discipline', score: 65, level: 'intermediate' }
    ];

    // Helper function to determine bankroll status
    const getBankrollStatus = (profit: number): string => {
        if (profit > 0) return 'increasing';
        if (profit < 0) return 'declining';
        return 'stable';
    };

    return {
        totalProfit: stats.netProfit || 0,
        recentTrend: trends.profitTrend || 0,
        streaks: {
            longestWinStreak: 5, // This would come from actual data
            currentWinStreak: trends.winningStreak || 0,
            currentLoseStreak: 0, // This would come from actual data
            longestLoseStreak: 0 // This would come from actual data
        },
        bankrollStatus: {
            status: getBankrollStatus(stats.netProfit)
        },
        skillMetrics,
        playerLevel: 'intermediate',
        expectedValue: -0.005, // Standard blackjack house edge
        actionSuccess: {
            'hit': { success: 45, count: 80, optimal: 70 },
            'stand': { success: 80, count: 120, optimal: 110 },
            'double': { success: 15, count: 20, optimal: 18 },
            'split': { success: 10, count: 15, optimal: 12 }
        }
    };
}

/**
 * Hook to get session metrics
 */
export function useSessionMetrics(): SessionMetrics {
    const analytics = useGameAnalytics();
    const currentSessionStats = analytics.getSessionStats();

    if (!currentSessionStats) {
        return {};
    }

    return {
        session: {
            id: currentSessionStats.id,
            startTime: new Date(currentSessionStats.startTime),
            handsPlayed: currentSessionStats.handsPlayed,
            netProfit: currentSessionStats.netProfit
        },
        metrics: {
            duration: currentSessionStats.duration || 0,
            averageBet: currentSessionStats.averageBet || 0,
            handsPerHour: currentSessionStats.handsPlayed > 0 && currentSessionStats.duration > 0
                ? (currentSessionStats.handsPlayed / (currentSessionStats.duration / 3600))
                : 0,
            profitPerHour: currentSessionStats.duration > 0
                ? (currentSessionStats.netProfit / (currentSessionStats.duration / 3600))
                : 0,
            winRate: currentSessionStats.winRate
        }
    };
}

/**
 * Hook to get strategy heat map data
 */
export function useStrategyHeatMap(): HeatMapEntry[] {
    // This is a placeholder implementation
    // In a real implementation, this would analyze rounds data from useAnalyticsStore

    // Sample heat map data
    return [
        { playerValue: 16, dealerCard: 10, action: 'hit', result: 'loss', count: 15 },
        { playerValue: 16, dealerCard: 6, action: 'stand', result: 'win', count: 12 },
        { playerValue: 11, dealerCard: 5, action: 'double', result: 'win', count: 8 },
        { playerValue: 8, dealerCard: 5, action: 'hit', result: 'win', count: 10 },
        { playerValue: 17, dealerCard: 7, action: 'stand', result: 'win', count: 14 },
        { playerValue: 12, dealerCard: 2, action: 'hit', result: 'loss', count: 9 },
        { playerValue: 10, dealerCard: 10, action: 'hit', result: 'win', count: 7 },
        { playerValue: 15, dealerCard: 9, action: 'hit', result: 'loss', count: 11 },
        { playerValue: 11, dealerCard: 10, action: 'double', result: 'win', count: 6 },
        { playerValue: 13, dealerCard: 6, action: 'stand', result: 'win', count: 8 }
    ];
}

export default useGameAnalytics;