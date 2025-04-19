'use client';

/**
 * Statistics Slice
 *
 * Tracks and calculates game statistics like win rates, profits, and player performance.
 * Provides analytics for game sessions and historical data.
 *
 * Implementation follows Facade pattern to centralize statistics tracking
 * and decouples statistics recording from game logic.
 */
import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Hand, HandAction } from '@/types/handTypes';
import { Bet } from '@/types/betTypes';

// Define result type
export type HandResult = 'win' | 'loss' | 'push' | 'blackjack' | 'surrender';

// Define StreakData type
interface StreakData {
    currentWinStreak: number;
    currentLoseStreak: number;
    longestWinStreak: number;
    longestLoseStreak: number;
}

// Define SessionData type
interface SessionData {
    id: string;
    startTime: Date;
    endTime?: Date;
    initialBalance: number;
    finalBalance?: number;
    handsPlayed: number;
    handsWon?: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    winRate: number;
}

// Define HandData type for tracking hand analytics
interface HandData {
    id: string;
    playerId: string;
    cards: string[];
    initialValue: number;
    finalValue: number;
    dealerUpCard?: string;
    action: HandAction;
    result: HandResult;
    wasOptimalPlay: boolean;
    profit: number;
    timestamp: Date;
}

// Define Performance metrics
interface PerformanceMetrics {
    decisionAccuracy: number; // 0-1
    betSizing: number; // 0-1
    consistencyScore: number; // 0-1
    riskManagement: number; // 0-1
    advantagePlayScore: number; // 0-1
    overallScore: number; // 0-1
}

// Define action success tracking
interface ActionSuccessData {
    count: number;
    success: number;
    successRate: number;
}

// Define extended hand type with properties needed for statistics
interface StatisticsHand extends Hand {
    playerId?: string;
    dealerUpCard?: {
        rank: string;
        suit: string;
    };
    lastAction?: HandAction;
    isBusted?: boolean;
}

// Define a more specific export type
interface StatisticsExport {
    summary: {
        gamesPlayed: number;
        handsPlayed: number;
        handsWon: number;
        handsLost: number;
        handsPushed: number;
        blackjacks: number;
        busts: number;
        surrenders: number;
        winRate: number;
        blackjackRate: number;
        bustRate: number;
        netProfit: number;
        averageBet: number;
        roi: number;
    };
    performanceMetrics: PerformanceMetrics;
    streaks: StreakData;
    actionSuccess: Record<HandAction, ActionSuccessData>;
    currentSession: SessionData | null;
    sessions: SessionData[];
    timeSeriesData: {
        balance: Array<{ timestamp: Date; value: number }>;
        winRate: Array<{ timestamp: Date; value: number }>;
    };
    exportDate: Date;
}

// Define the store state interface
interface StatisticsState {
    // Basic stats
    gamesPlayed: number;
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
    busts: number;
    surrenders: number;
    doubleWins: number;
    doubleLosses: number;
    splitWins: number;
    splitLosses: number;

    // Betting stats
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    averageBet: number;
    biggestWin: number;
    biggestLoss: number;

    // Rate calculations
    winRate: number;
    blackjackRate: number;
    bustRate: number;

    // Streaks
    streaks: StreakData;

    // Session data
    currentSession: SessionData | null;
    sessions: SessionData[];

    // Hand analytics
    handHistory: HandData[];

    // Performance metrics
    performanceMetrics: PerformanceMetrics;

    // Action success tracking
    actionSuccess: Record<HandAction, ActionSuccessData>;

    // Time series data
    timeSeriesData: {
        balance: Array<{ timestamp: Date; value: number }>;
        winRate: Array<{ timestamp: Date; value: number }>;
    };

    // Actions
    startSession: (initialBalance: number) => string;
    endSession: (finalBalance: number) => void;
    recordHand: (
        hand: StatisticsHand,
        result: HandResult,
        profit: number,
        wasOptimalPlay?: boolean
    ) => void;
    recordBet: (bet: Bet) => void;
    updateBalance: (newBalance: number) => void;
    resetStatistics: () => void;
    getWinRate: () => number;
    getPlayerPerformance: () => PerformanceMetrics;
    getSessionStats: (sessionId?: string) => SessionData | null;
    exportStatistics: () => StatisticsExport;
}

// Create a function that returns the slice for integration with the main store
export const createStatisticsSlice = (
    set: (
        state: Partial<StatisticsState> | ((state: StatisticsState) => Partial<StatisticsState>)
    ) => void,
    get: () => StatisticsState
) => ({
    // Initial state - Basic stats
    gamesPlayed: 0,
    handsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    handsPushed: 0,
    blackjacks: 0,
    busts: 0,
    surrenders: 0,
    doubleWins: 0,
    doubleLosses: 0,
    splitWins: 0,
    splitLosses: 0,

    // Betting stats
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
    averageBet: 0,
    biggestWin: 0,
    biggestLoss: 0,

    // Rate calculations
    winRate: 0,
    blackjackRate: 0,
    bustRate: 0,

    // Streaks
    streaks: {
        currentWinStreak: 0,
        currentLoseStreak: 0,
        longestWinStreak: 0,
        longestLoseStreak: 0,
    },

    // Session data
    currentSession: null,
    sessions: [],

    // Hand analytics
    handHistory: [],

    // Performance metrics
    performanceMetrics: {
        decisionAccuracy: 0,
        betSizing: 0,
        consistencyScore: 0,
        riskManagement: 0,
        advantagePlayScore: 0,
        overallScore: 0,
    },

    // Action success tracking
    actionSuccess: {
        'hit': { count: 0, success: 0, successRate: 0 },
        'stand': { count: 0, success: 0, successRate: 0 },
        'double': { count: 0, success: 0, successRate: 0 },
        'split': { count: 0, success: 0, successRate: 0 },
        'surrender': { count: 0, success: 0, successRate: 0 },
        'insurance': { count: 0, success: 0, successRate: 0 },
    },

    // Time series data
    timeSeriesData: {
        balance: [],
        winRate: [],
    },

    // Start a new session
    startSession: (initialBalance: number) => {
        const sessionId = uuidv4();
        const session: SessionData = {
            id: sessionId,
            startTime: new Date(),
            initialBalance,
            handsPlayed: 0,
            handsWon: 0,
            totalWagered: 0,
            totalWon: 0,
            netProfit: 0,
            winRate: 0,
        };

        set({
            currentSession: session,
            timeSeriesData: {
                ...get().timeSeriesData,
                balance: [
                    ...get().timeSeriesData.balance,
                    { timestamp: new Date(), value: initialBalance }
                ]
            }
        });

        return sessionId;
    },

    // End the current session
    endSession: (finalBalance: number) => {
        const { currentSession } = get();

        if (!currentSession) return;

        const endTime = new Date();
        const netProfit = finalBalance - currentSession.initialBalance;
        const winRate = currentSession.handsPlayed > 0
            ? (currentSession.handsWon || 0) / currentSession.handsPlayed
            : 0;

        const completedSession: SessionData = {
            ...currentSession,
            endTime,
            finalBalance,
            netProfit,
            winRate,
        };

        set((state: StatisticsState) => ({
            currentSession: null,
            sessions: [...state.sessions, completedSession],
            timeSeriesData: {
                ...state.timeSeriesData,
                balance: [
                    ...state.timeSeriesData.balance,
                    { timestamp: new Date(), value: finalBalance }
                ]
            }
        }));
    },

    // Record a hand result
    recordHand: (
        hand: StatisticsHand,
        result: HandResult,
        profit: number,
        wasOptimalPlay = true
    ) => {
        set((state: StatisticsState) => {
            // Extract updates into separate calculations to reduce complexity
            const handCountsUpdate = calculateHandCounts(state, hand, result);
            const streaksUpdate = updateStreaks(state.streaks, result);
            const ratesUpdate = calculateRates(handCountsUpdate);
            const profitUpdate = updateProfitData(state, profit);

            // Create hand data for analytics
            const handData = createHandData(hand, result, wasOptimalPlay, profit);

            // Update action success tracking
            const actionSuccessUpdate = updateActionSuccess(state.actionSuccess, hand.lastAction, result);

            // Update current session
            const sessionUpdate = updateCurrentSession(state.currentSession, hand, result, profit);

            // Calculate performance metrics
            const metricsUpdate = updatePerformanceMetrics(
                state.performanceMetrics,
                state.handHistory,
                wasOptimalPlay,
                hand
            );

            // Build time series data update
            const timeSeriesUpdate = {
                ...state.timeSeriesData,
                winRate: [
                    ...state.timeSeriesData.winRate,
                    { timestamp: new Date(), value: ratesUpdate.winRate }
                ]
            };

            // Return the updated state
            return {
                ...handCountsUpdate,
                ...ratesUpdate,
                ...profitUpdate,
                streaks: streaksUpdate,
                handHistory: [handData, ...state.handHistory].slice(0, 100), // Keep last 100 hands
                performanceMetrics: metricsUpdate,
                actionSuccess: actionSuccessUpdate,
                currentSession: sessionUpdate,
                timeSeriesData: timeSeriesUpdate
            };
        });
    },

    // Record a bet
    recordBet: (bet: Bet) => {
        set((state: StatisticsState) => {
            // Update totals
            const newTotalWagered = state.totalWagered + bet.amount;

            // Calculate new average bet
            const newAverageBet = state.handsPlayed > 0
                ? (state.averageBet * state.handsPlayed + bet.amount) / (state.handsPlayed + 1)
                : bet.amount;

            // Update current session if active
            let updatedSession = state.currentSession;
            if (updatedSession) {
                updatedSession = {
                    ...updatedSession,
                    totalWagered: updatedSession.totalWagered + bet.amount
                };
            }

            return {
                totalWagered: newTotalWagered,
                averageBet: newAverageBet,
                currentSession: updatedSession
            };
        });
    },

    // Update balance for time series tracking
    updateBalance: (newBalance: number) => {
        set((state: StatisticsState) => ({
            timeSeriesData: {
                ...state.timeSeriesData,
                balance: [
                    ...state.timeSeriesData.balance,
                    { timestamp: new Date(), value: newBalance }
                ]
            }
        }));
    },

    // Reset all statistics
    resetStatistics: () => {
        const { currentSession } = get();

        set({
            gamesPlayed: 0,
            handsPlayed: 0,
            handsWon: 0,
            handsLost: 0,
            handsPushed: 0,
            blackjacks: 0,
            busts: 0,
            surrenders: 0,
            doubleWins: 0,
            doubleLosses: 0,
            splitWins: 0,
            splitLosses: 0,
            totalWagered: 0,
            totalWon: 0,
            netProfit: 0,
            averageBet: 0,
            biggestWin: 0,
            biggestLoss: 0,
            winRate: 0,
            blackjackRate: 0,
            bustRate: 0,
            currentSession,
            sessions: [],
            handHistory: [],
            streaks: {
                currentWinStreak: 0,
                currentLoseStreak: 0,
                longestWinStreak: 0,
                longestLoseStreak: 0,
            },
            performanceMetrics: {
                decisionAccuracy: 0,
                betSizing: 0,
                consistencyScore: 0,
                riskManagement: 0,
                advantagePlayScore: 0,
                overallScore: 0,
            },
            actionSuccess: {
                'hit': { count: 0, success: 0, successRate: 0 },
                'stand': { count: 0, success: 0, successRate: 0 },
                'double': { count: 0, success: 0, successRate: 0 },
                'split': { count: 0, success: 0, successRate: 0 },
                'surrender': { count: 0, success: 0, successRate: 0 },
                'insurance': { count: 0, success: 0, successRate: 0 },
            },
            timeSeriesData: {
                balance: currentSession ? [{
                    timestamp: currentSession.startTime,
                    value: currentSession.initialBalance
                }] : [],
                winRate: []
            }
        });
    },

    // Get current win rate
    getWinRate: () => {
        const { handsPlayed, handsWon } = get();
        return handsPlayed > 0 ? handsWon / handsPlayed : 0;
    },

    // Get player performance metrics
    getPlayerPerformance: () => {
        return get().performanceMetrics;
    },

    // Get session stats
    getSessionStats: (sessionId?: string): SessionData | null => {
        const { currentSession, sessions } = get();

        if (sessionId) {
            const foundSession = sessions.find((s: SessionData) => s.id === sessionId);
            return foundSession || null;
        }

        // Make sure we always return SessionData | null, not undefined
        return currentSession || (sessions.length > 0 ? sessions[sessions.length - 1] || null : null);
    },

    // Export statistics for external use
    exportStatistics: (): StatisticsExport => {
        const state = get();

        return {
            summary: {
                gamesPlayed: state.gamesPlayed,
                handsPlayed: state.handsPlayed,
                handsWon: state.handsWon,
                handsLost: state.handsLost,
                handsPushed: state.handsPushed,
                blackjacks: state.blackjacks,
                busts: state.busts,
                surrenders: state.surrenders,
                winRate: state.winRate,
                blackjackRate: state.blackjackRate,
                bustRate: state.bustRate,
                netProfit: state.netProfit,
                averageBet: state.averageBet,
                roi: state.totalWagered > 0 ? (state.netProfit / state.totalWagered) * 100 : 0
            },
            performanceMetrics: state.performanceMetrics,
            streaks: state.streaks,
            actionSuccess: state.actionSuccess,
            currentSession: state.currentSession,
            sessions: state.sessions,
            timeSeriesData: state.timeSeriesData,
            exportDate: new Date()
        };
    }
});

// Create the store with subscribeWithSelector for listening to state changes
export const useStatisticsStore = create<StatisticsState>()(
    subscribeWithSelector(
        devtools(
            persist(
                (set, get) => createStatisticsSlice(set, get) as StatisticsState,
                { name: 'statistics-storage' }
            )
        )
    )
);

// Helper functions to reduce complexity

// Calculate updated hand counts
const calculateHandCounts = (state: StatisticsState, hand: StatisticsHand, result: HandResult) => {
    // Process the main result type count
    const resultCounts = processResultCounts(state, result);

    // Process special cases separately
    const specialCounts = processSpecialCounts(state, hand, result);

    // Return combined updated counts
    return {
        handsPlayed: state.handsPlayed + 1,
        ...resultCounts,
        ...specialCounts
    };
};

// Process the primary result counts (win/loss/push)
const processResultCounts = (state: StatisticsState, result: HandResult) => {
    const isWin = result === 'win' || result === 'blackjack';
    const isLoss = result === 'loss' || result === 'surrender';

    return {
        handsWon: state.handsWon + (isWin ? 1 : 0),
        handsLost: state.handsLost + (isLoss ? 1 : 0),
        handsPushed: state.handsPushed + (result === 'push' ? 1 : 0),
    };
};

// Process special case counts
const processSpecialCounts = (state: StatisticsState, hand: StatisticsHand, result: HandResult) => {
    const isWin = result === 'win' || result === 'blackjack';
    const isLoss = result === 'loss' || result === 'surrender';

    return {
        blackjacks: state.blackjacks + (result === 'blackjack' ? 1 : 0),
        busts: state.busts + (hand.isBusted && isLoss ? 1 : 0),
        surrenders: state.surrenders + (result === 'surrender' ? 1 : 0),
        doubleWins: state.doubleWins + (hand.isDoubled && isWin ? 1 : 0),
        doubleLosses: state.doubleLosses + (hand.isDoubled && isLoss ? 1 : 0),
        splitWins: state.splitWins + (hand.isSplit && isWin ? 1 : 0),
        splitLosses: state.splitLosses + (hand.isSplit && isLoss ? 1 : 0),
    };
};

// Update streak data
const updateStreaks = (currentStreaks: StreakData, result: HandResult): StreakData => {
    const streaks = { ...currentStreaks };
    const isWin = result === 'win' || result === 'blackjack';
    const isLoss = result === 'loss' || result === 'surrender';

    if (isWin) {
        streaks.currentWinStreak++;
        streaks.currentLoseStreak = 0;
        streaks.longestWinStreak = Math.max(streaks.longestWinStreak, streaks.currentWinStreak);
    } else if (isLoss) {
        streaks.currentLoseStreak++;
        streaks.currentWinStreak = 0;
        streaks.longestLoseStreak = Math.max(streaks.longestLoseStreak, streaks.currentLoseStreak);
    }
    // Pushes don't affect streaks

    return streaks;
};

// Calculate updated rates
const calculateRates = (counts: ReturnType<typeof calculateHandCounts>) => {
    const newWinRate = counts.handsWon / (counts.handsPlayed || 1);
    const newBlackjackRate = counts.blackjacks / (counts.handsPlayed || 1);
    const newBustRate = counts.busts / (counts.handsPlayed || 1);

    return {
        winRate: newWinRate,
        blackjackRate: newBlackjackRate,
        bustRate: newBustRate,
    };
};

// Update profit data
const updateProfitData = (state: StatisticsState, profit: number) => {
    const newNetProfit = state.netProfit + profit;
    const newBiggestWin = profit > 0 ? Math.max(state.biggestWin, profit) : state.biggestWin;
    const newBiggestLoss = profit < 0 ? Math.min(state.biggestLoss, profit) : state.biggestLoss;

    return {
        netProfit: newNetProfit,
        biggestWin: newBiggestWin,
        biggestLoss: newBiggestLoss,
    };
};

// Create hand data for analytics
const createHandData = (
    hand: StatisticsHand,
    result: HandResult,
    wasOptimalPlay: boolean,
    profit: number
): HandData => {
    return {
        id: hand.id,
        playerId: hand.playerId || '',
        cards: hand.cards.map(card => `${card.rank}${card.suit}`),
        initialValue: hand.values[0] || 0,
        finalValue: hand.values[hand.values.length - 1] || 0,
        dealerUpCard: hand.dealerUpCard ? `${hand.dealerUpCard.rank}${hand.dealerUpCard.suit}` : undefined,
        action: hand.lastAction || 'stand',
        result,
        wasOptimalPlay,
        profit,
        timestamp: new Date(),
    };
};

// Update action success tracking
const updateActionSuccess = (
    currentActionSuccess: StatisticsState['actionSuccess'],
    lastAction: HandAction | undefined,
    result: HandResult
) => {
    const actionSuccess = { ...currentActionSuccess };
    const isWin = result === 'win' || result === 'blackjack';

    if (lastAction) {
        const action = lastAction;
        const currentActionData = actionSuccess[action];
        if (currentActionData) {
            actionSuccess[action] = {
                count: currentActionData.count + 1,
                success: currentActionData.success + (isWin ? 1 : 0),
                successRate: (currentActionData.success + (isWin ? 1 : 0)) / (currentActionData.count + 1),
            };
        }
    }

    return actionSuccess;
};

// Update current session
const updateCurrentSession = (
    currentSession: SessionData | null,
    hand: StatisticsHand,
    result: HandResult,
    profit: number
): SessionData | null => {
    if (!currentSession) return null;

    const isWin = result === 'win' || result === 'blackjack';

    // Extract nested ternary into separate statements
    let betAmount = 0;
    if (typeof hand.bet === 'number') {
        betAmount = hand.bet;
    } else if (typeof hand.bet === 'object' && hand.bet && 'amount' in hand.bet) {
        betAmount = (hand.bet as { amount: number }).amount;
    }

    // Extract nested ternary for win rate calculation
    let winRate;
    if (currentSession.handsPlayed > 0) {
        winRate = ((currentSession.handsWon || 0) + (isWin ? 1 : 0)) / (currentSession.handsPlayed + 1);
    } else {
        winRate = isWin ? 1 : 0;
    }

    return {
        ...currentSession,
        handsPlayed: currentSession.handsPlayed + 1,
        handsWon: (currentSession.handsWon || 0) + (isWin ? 1 : 0),
        totalWagered: currentSession.totalWagered + betAmount,
        totalWon: currentSession.totalWon + (profit > 0 ? profit : 0),
        netProfit: currentSession.netProfit + profit,
        winRate
    };
};

// Update performance metrics
const updatePerformanceMetrics = (
    currentMetrics: PerformanceMetrics,
    handHistory: HandData[],
    wasOptimalPlay: boolean,
    hand: StatisticsHand
): PerformanceMetrics => {
    const metrics = { ...currentMetrics };

    // Update decision accuracy
    const totalOptimal = handHistory.filter(h => h.wasOptimalPlay).length;
    metrics.decisionAccuracy = (totalOptimal + (wasOptimalPlay ? 1 : 0)) / (handHistory.length + 1);

    // Update bet sizing metric
    if (hand.bet) {
        // Extract nested ternary into separate statements
        let betAmount = 0;
        if (typeof hand.bet === 'number') {
            betAmount = hand.bet;
        } else if (typeof hand.bet === 'object' && hand.bet && 'amount' in hand.bet) {
            betAmount = (hand.bet as { amount: number }).amount;
        }

        const isBetSizeOptimal = betAmount > 0 && betAmount <= 100;
        metrics.betSizing = 0.9 * metrics.betSizing + 0.1 * (isBetSizeOptimal ? 1 : 0.5);
    }

    // Update consistency score
    const recentHands = handHistory.slice(0, Math.min(10, handHistory.length));
    const recentOptimal = recentHands.filter(h => h.wasOptimalPlay).length;
    const shortTermConsistency = recentHands.length > 0 ? recentOptimal / recentHands.length : 0;
    metrics.consistencyScore = 0.8 * metrics.consistencyScore + 0.2 * shortTermConsistency;

    // Calculate overall score
    metrics.overallScore = (
        metrics.decisionAccuracy +
        metrics.betSizing +
        metrics.consistencyScore +
        metrics.riskManagement +
        metrics.advantagePlayScore
    ) / 5;

    return metrics;
};

// ======= Facade Pattern Implementation ======= //

// Define selector hooks for accessing statistics data
export const useStatistics = () => {
    return {
        // Basic statistics selectors
        useBasicStats: () => useStatisticsStore(state => ({
            handsPlayed: state.handsPlayed,
            handsWon: state.handsWon,
            handsLost: state.handsLost,
            handsPushed: state.handsPushed,
            winRate: state.winRate,
        })),

        // Special hand statistics
        useSpecialHandStats: () => useStatisticsStore(state => ({
            blackjacks: state.blackjacks,
            busts: state.busts,
            surrenders: state.surrenders,
            doubleWins: state.doubleWins,
            doubleLosses: state.doubleLosses,
            splitWins: state.splitWins,
            splitLosses: state.splitLosses,
            blackjackRate: state.blackjackRate,
            bustRate: state.bustRate,
        })),

        // Betting statistics
        useBettingStats: () => useStatisticsStore(state => ({
            totalWagered: state.totalWagered,
            totalWon: state.totalWon,
            netProfit: state.netProfit,
            averageBet: state.averageBet,
            biggestWin: state.biggestWin,
            biggestLoss: state.biggestLoss,
            roi: state.totalWagered > 0 ? (state.netProfit / state.totalWagered) * 100 : 0,
        })),

        // Streak statistics
        useStreakStats: () => useStatisticsStore(state => state.streaks),

        // Session information
        useSessionStats: () => useStatisticsStore(state => ({
            currentSession: state.currentSession,
            sessions: state.sessions,
            getSessionStats: state.getSessionStats,
        })),

        // Performance metrics
        usePerformanceMetrics: () => useStatisticsStore(state => state.performanceMetrics),

        // Action success rates
        useActionSuccessRates: () => useStatisticsStore(state => state.actionSuccess),

        // Time series data for charting
        useTimeSeriesData: () => useStatisticsStore(state => state.timeSeriesData),

        // Utility functions
        getWinRate: useStatisticsStore.getState().getWinRate,
        resetStatistics: useStatisticsStore.getState().resetStatistics,
        exportStatistics: useStatisticsStore.getState().exportStatistics,
    };
};

// Setup middleware to connect with the game FSM
export const setupStatisticsMiddleware = (gameStore: any) => {
    // Subscribe to game phase transitions
    gameStore.subscribe(
        (state: any) => state.gamePhase,
        (gamePhase: string) => {
            // Listen for settlement phase to record statistics
            if (gamePhase === 'settlement') {
                const gameState = gameStore.getState();
                const { playerHands, dealerHand } = gameState;

                // Process each hand for statistical tracking
                playerHands.forEach((hand: any) => {
                    if (hand.result) {
                        const statisticsHand: StatisticsHand = {
                            ...hand,
                            cards: hand.cards.map((cardId: string) => gameState.entities.cards[cardId]),
                            values: [hand.bestValue],
                            lastAction: gameState.lastAction || 'stand',
                            dealerUpCard: dealerHand.cards.length > 0
                                ? gameState.entities.cards[dealerHand.cards[0]]
                                : undefined
                        };

                        // Map game result to statistics result type
                        const resultMap: Record<string, HandResult> = {
                            'win': 'win',
                            'loss': 'loss',
                            'push': 'push',
                            'blackjack': 'blackjack',
                            'surrender': 'surrender',
                            'bust': 'loss'
                        };

                        // Calculate profit for the hand
                        const profit = hand.result === 'win' || hand.result === 'blackjack'
                            ? hand.bet * (hand.result === 'blackjack' ? 1.5 : 1)
                            : (hand.result === 'push' ? 0 : -hand.bet);

                        // Record the hand in statistics
                        useStatisticsStore.getState().recordHand(
                            statisticsHand,
                            resultMap[hand.result] || 'loss',
                            profit,
                            true // Assume optimal play for now, can be determined by strategy engine later
                        );
                    }
                });
            }
        }
    );
};

// ======= Legacy selectors for backward compatibility ======= //

export const useGameStats = () => {
    const stats = useStatisticsStore((state) => ({
        handsPlayed: state.handsPlayed,
        handsWon: state.handsWon,
        handsLost: state.handsLost,
        handsPushed: state.handsPushed,
        blackjacks: state.blackjacks,
        netProfit: state.netProfit,
        winRate: state.winRate
    }));

    return stats;
};

export const usePerformanceMetrics = () => {
    return useStatisticsStore((state) => state.performanceMetrics);
};

export const useSessionStats = () => {
    const sessionStats = useStatisticsStore((state) => state.getSessionStats());
    return sessionStats;
};