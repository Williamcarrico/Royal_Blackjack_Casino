'use client';

/**
 * Core analytics store for tracking game statistics
 */
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { GameStatistics, GameAction, GameRound } from '@/types/gameTypes';
import { Hand, HandAction } from '@/types/handTypes';
import { Bet } from '@/types/betTypes';

// Define analytics session type
interface AnalyticsSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    initialBalance: number;
    finalBalance?: number;
    duration?: number; // in seconds
    handsPlayed: number;
    roundsPlayed: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    gameActions: GameAction[];
}

// Define player performance metrics
interface PlayerPerformanceMetrics {
    decisionAccuracy: number; // 0-1 scale of optimal play
    betSizing: number; // 0-1 scale of optimal bet sizing
    consistencyScore: number; // 0-1 scale of consistent play
    riskManagement: number; // 0-1 scale of risk management
    advantagePlayScore: number; // 0-1 scale of advantage play techniques
}

// Define hand analytics type
interface HandAnalytics {
    id: string;
    playerId: string;
    cards: string[];
    initialValue: number;
    finalValue: number;
    dealerUpCard?: string;
    result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender';
    action: HandAction;
    optimalAction?: HandAction;
    wasOptimalPlay: boolean;
    profit: number;
    timestamp: Date;
}

// Define game event type
interface GameEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: GameEventData;
}

// Define game event data type
type GameEventData =
    | { balance: number }
    | { balance: number; duration: number; profit: number }
    | GameStatistics
    | { handId: string; result: string; profit: number; optimal: boolean }
    | Bet
    | GameAction
    | null;

// Define heat map data type
interface HeatMapData {
    playerValue: number;
    dealerValue: number;
    action: HandAction;
    result: string;
    count: number;
}

// Define performance metrics type
interface PerformanceMetrics {
    skillMetrics: {
        basicStrategy: number; // 0-100
        cardCounting: number; // 0-100
        bankrollManagement: number; // 0-100
        disciplineScore: number; // 0-100
        overallSkill: number; // 0-100
    };
    streaks: {
        currentWinStreak: number;
        currentLoseStreak: number;
        longestWinStreak: number;
        longestLoseStreak: number;
    };
    winRateByDealer: Record<string | number, number>; // Win rate indexed by dealer up card value
    winRateByHandValue: Record<string | number, number>; // Win rate indexed by initial hand value
    actionSuccess: Record<HandAction, { count: number; success: number }>; // Success rate per action
    playerPerformanceMetrics: PlayerPerformanceMetrics; // Detailed player performance metrics
}

// Define win rate metrics type
interface WinRateMetrics {
    winRate: number;
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
}

// Define extended hand type
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

// Define session analysis type
interface SessionAnalysis {
    session: AnalyticsSession;
    metrics: {
        duration: number;
        handsPerHour: number;
        profitPerHour: number;
        averageBet: number;
        winRate?: number;
    };
}

// Define performance report type
interface PerformanceReport {
    skillMetrics: Array<{
        category: string;
        level: string;
        score: number;
    }>;
    detailedPerformance: PlayerPerformanceMetrics;
    streaks: {
        currentWinStreak: number;
        currentLoseStreak: number;
        longestWinStreak: number;
        longestLoseStreak: number;
    };
    winRate: number;
    blackjackRate: number;
    totalProfit: number;
    expectedValue: number;
    playerLevel: string;
}

// Define analytics export type
interface AnalyticsExport {
    summary: {
        gamesPlayed: number;
        handsPlayed: number;
        winRate: number;
        blackjackRate: number;
        bustRate: number;
        netProfit: number;
        averageBet: number;
        roi: number;
    };
    performance: PerformanceMetrics;
    streaks: {
        currentWinStreak: number;
        currentLoseStreak: number;
        longestWinStreak: number;
        longestLoseStreak: number;
    };
    currentSession: AnalyticsSession | null;
    sessions: AnalyticsSession[];
    handAnalytics: HandAnalytics[];
    heatMapData: HeatMapData[];
    timeSeriesData: {
        balance: Array<{ timestamp: Date; value: number }>;
        winRate: Array<{ timestamp: Date; value: number }>;
    };
    exportDate: Date;
}

// Define analytics store state
interface AnalyticsStoreState {
    // Session management
    currentSession: AnalyticsSession | null;
    sessions: AnalyticsSession[];

    // Game statistics
    gamesPlayed: number;
    handsPlayed: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;

    // Play statistics
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
    busts: number;
    surrenders: number;
    insuranceTaken: number;
    insuranceWon: number;
    doublesWon: number;
    doublesLost: number;
    splitsWon: number;
    splitsLost: number;

    // Rate calculations
    winRate: number;
    blackjackRate: number;
    bustRate: number;

    // Bet statistics
    averageBet: number;
    biggestWin: number;
    biggestLoss: number;

    // Streak records
    streaks: {
        currentWinStreak: number;
        currentLoseStreak: number;
        longestWinStreak: number;
        longestLoseStreak: number;
    };

    // Detailed analytics collections
    handAnalytics: HandAnalytics[];
    gameEvents: GameEvent[];
    heatMapData: HeatMapData[];
    performanceMetrics: PerformanceMetrics;

    // Temporal analytics
    timeSeriesData: {
        balance: Array<{ timestamp: Date; value: number }>;
        winRate: Array<{ timestamp: Date; value: number }>;
    };

    // History storage
    history: {
        gameResults: Array<{
            gameId: string;
            timestamp: Date;
            profit: number;
            handsPlayed: number;
        }>;
        recentHands: Hand[];
        recentBets: Bet[];
        recentRounds: GameRound[];
    };

    // Actions
    startSession: (initialBalance: number) => void;
    endSession: (finalBalance: number) => void;
    recordGamePlayed: (gameResult: GameStatistics) => void;
    recordHand: (hand: ExtendedHand, result: string, profit: number, wasOptimalPlay?: boolean, optimalAction?: HandAction) => void;
    recordBet: (bet: Bet) => void;
    recordGameAction: (action: GameAction) => void;
    recordGameEvent: (type: string, data: GameEventData) => void;
    updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics['skillMetrics']>) => void;
    updatePlayerPerformanceMetrics: (metrics: Partial<PlayerPerformanceMetrics>) => void;
    resetStatistics: () => void;
    getWinRate: () => WinRateMetrics;
    getPerformanceReport: () => PerformanceReport;
    getHandAnalysis: (handId: string) => HandAnalytics | undefined;
    getHeatMapAnalysis: () => HeatMapData[];
    getSessionAnalysis: (sessionId?: string) => SessionAnalysis | null;
    exportAnalytics: () => AnalyticsExport;
}

// Helper functions
const createHandAnalytic = (
    hand: ExtendedHand,
    result: string,
    profit: number,
    wasOptimalPlay: boolean,
    optimalAction?: HandAction
): HandAnalytics => {
    return {
        id: hand.id,
        playerId: hand.playerId || 'unknown',
        cards: hand.cards.map(card => `${card.rank}${card.suit}`),
        initialValue: hand.initialValue || 0,
        finalValue: hand.value,
        dealerUpCard: hand.dealerUpCard ? `${hand.dealerUpCard.rank}${hand.dealerUpCard.suit}` : undefined,
        result: result as 'win' | 'loss' | 'push' | 'blackjack' | 'surrender',
        action: hand.lastAction || 'none',
        optimalAction,
        wasOptimalPlay,
        profit,
        timestamp: new Date()
    };
};

// Create the analytics store
export const useAnalyticsStore = create<AnalyticsStoreState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                currentSession: null,
                sessions: [],
                gamesPlayed: 0,
                handsPlayed: 0,
                totalWagered: 0,
                totalWon: 0,
                netProfit: 0,
                handsWon: 0,
                handsLost: 0,
                handsPushed: 0,
                blackjacks: 0,
                busts: 0,
                surrenders: 0,
                insuranceTaken: 0,
                insuranceWon: 0,
                doublesWon: 0,
                doublesLost: 0,
                splitsWon: 0,
                splitsLost: 0,
                winRate: 0,
                blackjackRate: 0,
                bustRate: 0,
                averageBet: 0,
                biggestWin: 0,
                biggestLoss: 0,
                streaks: {
                    currentWinStreak: 0,
                    currentLoseStreak: 0,
                    longestWinStreak: 0,
                    longestLoseStreak: 0,
                },
                handAnalytics: [],
                gameEvents: [],
                heatMapData: [],
                performanceMetrics: {
                    skillMetrics: {
                        basicStrategy: 0,
                        cardCounting: 0,
                        bankrollManagement: 0,
                        disciplineScore: 0,
                        overallSkill: 0,
                    },
                    streaks: {
                        currentWinStreak: 0,
                        currentLoseStreak: 0,
                        longestWinStreak: 0,
                        longestLoseStreak: 0,
                    },
                    winRateByDealer: {},
                    winRateByHandValue: {},
                    actionSuccess: {
                        'hit': { count: 0, success: 0 },
                        'stand': { count: 0, success: 0 },
                        'double': { count: 0, success: 0 },
                        'split': { count: 0, success: 0 },
                        'surrender': { count: 0, success: 0 },
                        'insurance': { count: 0, success: 0 }
                    },
                    playerPerformanceMetrics: {
                        decisionAccuracy: 0,
                        betSizing: 0,
                        consistencyScore: 0,
                        riskManagement: 0,
                        advantagePlayScore: 0
                    }
                },
                timeSeriesData: {
                    balance: [],
                    winRate: []
                },
                history: {
                    gameResults: [],
                    recentHands: [],
                    recentBets: [],
                    recentRounds: []
                },

                // Actions
                startSession: (initialBalance) => {
                    const sessionId = uuidv4();
                    const session: AnalyticsSession = {
                        id: sessionId,
                        startTime: new Date(),
                        initialBalance,
                        handsPlayed: 0,
                        roundsPlayed: 0,
                        totalWagered: 0,
                        totalWon: 0,
                        netProfit: 0,
                        gameActions: []
                    };

                    set(state => ({
                        ...state,
                        currentSession: session,
                        timeSeriesData: {
                            ...state.timeSeriesData,
                            balance: [...state.timeSeriesData.balance, { timestamp: session.startTime, value: initialBalance }]
                        }
                    }));

                    // Record event
                    get().recordGameEvent('session_start', { balance: initialBalance });
                },

                endSession: (finalBalance) => {
                    const { currentSession } = get();

                    if (!currentSession) {
                        return;
                    }

                    const endTime = new Date();
                    const duration = (endTime.getTime() - currentSession.startTime.getTime()) / 1000;
                    const netProfit = finalBalance - currentSession.initialBalance;

                    const completedSession: AnalyticsSession = {
                        ...currentSession,
                        endTime,
                        finalBalance,
                        duration,
                        netProfit
                    };

                    set(state => ({
                        ...state,
                        currentSession: null,
                        sessions: [...state.sessions, completedSession],
                        timeSeriesData: {
                            ...state.timeSeriesData,
                            balance: [...state.timeSeriesData.balance, { timestamp: endTime, value: finalBalance }]
                        }
                    }));

                    // Record event
                    get().recordGameEvent('session_end', { balance: finalBalance, duration, profit: netProfit });
                },

                recordGamePlayed: (gameResult) => {
                    set(state => {
                        let currentSession = state.currentSession;
                        if (currentSession) {
                            currentSession = {
                                ...currentSession,
                                roundsPlayed: currentSession.roundsPlayed + 1,
                                handsPlayed: currentSession.handsPlayed + gameResult.handsPlayed,
                                totalWagered: currentSession.totalWagered + gameResult.totalWagered,
                                totalWon: currentSession.totalWon + gameResult.totalWon,
                                netProfit: currentSession.netProfit + gameResult.netProfit
                            };
                        }

                        // Update global stats
                        return {
                            ...state,
                            currentSession,
                            gamesPlayed: state.gamesPlayed + 1,
                            handsPlayed: state.handsPlayed + gameResult.handsPlayed,
                            totalWagered: state.totalWagered + gameResult.totalWagered,
                            totalWon: state.totalWon + gameResult.totalWon,
                            netProfit: state.netProfit + gameResult.netProfit,
                            history: {
                                ...state.history,
                                gameResults: [
                                    ...state.history.gameResults,
                                    {
                                        gameId: uuidv4(),
                                        timestamp: new Date(),
                                        profit: gameResult.netProfit,
                                        handsPlayed: gameResult.handsPlayed
                                    }
                                ].slice(-100)
                            }
                        };
                    });

                    // Record event
                    get().recordGameEvent('game_completed', gameResult);
                },

                recordHand: (hand, result, profit, wasOptimalPlay = true, optimalAction) => {
                    // Create hand analytics entry
                    const handAnalytic = createHandAnalytic(hand, result, profit, wasOptimalPlay, optimalAction);

                    // Update state with hand analytics
                    set(state => {
                        // Update session if it exists
                        let currentSession = state.currentSession;
                        if (currentSession) {
                            currentSession = {
                                ...currentSession,
                                handsPlayed: currentSession.handsPlayed + 1,
                                netProfit: currentSession.netProfit + profit
                            };
                        }

                        // Update hand count statistics based on result
                        let handsWon = state.handsWon;
                        let handsLost = state.handsLost;
                        let handsPushed = state.handsPushed;
                        let blackjacks = state.blackjacks;
                        let busts = state.busts;
                        let surrenders = state.surrenders;
                        let doublesWon = state.doublesWon;
                        let doublesLost = state.doublesLost;
                        let splitsWon = state.splitsWon;
                        let splitsLost = state.splitsLost;

                        // Process result
                        if (result === 'win') {
                            handsWon++;
                            if (hand.lastAction === 'double') {
                                doublesWon++;
                            } else if (hand.lastAction === 'split') {
                                splitsWon++;
                            }
                        } else if (result === 'loss') {
                            handsLost++;
                            if (hand.isBusted) {
                                busts++;
                            }
                            if (hand.lastAction === 'double') {
                                doublesLost++;
                            } else if (hand.lastAction === 'split') {
                                splitsLost++;
                            }
                        } else if (result === 'push') {
                            handsPushed++;
                        } else if (result === 'blackjack') {
                            handsWon++;
                            blackjacks++;
                        } else if (result === 'surrender') {
                            handsLost++;
                            surrenders++;
                        }

                        // Update win rate metrics
                        const totalHands = state.handsPlayed + 1;
                        const winRate = (handsWon + blackjacks) / totalHands;
                        const blackjackRate = blackjacks / totalHands;
                        const bustRate = busts / totalHands;

                        // Update hand history
                        const recentHands = [...state.history.recentHands, hand].slice(-50);

                        // Update streaks
                        let streaks = { ...state.streaks };
                        if (result === 'win' || result === 'blackjack') {
                            streaks.currentWinStreak++;
                            streaks.currentLoseStreak = 0;
                            streaks.longestWinStreak = Math.max(streaks.longestWinStreak, streaks.currentWinStreak);
                        } else if (result === 'loss' || result === 'surrender') {
                            streaks.currentLoseStreak++;
                            streaks.currentWinStreak = 0;
                            streaks.longestLoseStreak = Math.max(streaks.longestLoseStreak, streaks.currentLoseStreak);
                        }

                        // Add hand analytics to collection
                        const handAnalytics = [handAnalytic, ...state.handAnalytics].slice(0, 500);

                        // Update heat map data
                        const heatMapData = [...state.heatMapData];
                        if (hand.initialValue && hand.dealerUpCard && hand.lastAction) {
                            const playerValue = hand.initialValue;
                            const dealerValue = hand.dealerUpCard.value;
                            const action = hand.lastAction;

                            // Find existing heat map entry or create a new one
                            const existingEntryIndex = heatMapData.findIndex(
                                entry => entry.playerValue === playerValue &&
                                    entry.dealerValue === dealerValue &&
                                    entry.action === action &&
                                    entry.result === result
                            );

                            if (existingEntryIndex >= 0) {
                                heatMapData[existingEntryIndex].count++;
                            } else {
                                heatMapData.push({
                                    playerValue,
                                    dealerValue,
                                    action,
                                    result,
                                    count: 1
                                });
                            }
                        }

                        // Update performance metrics
                        const performanceMetrics = { ...state.performanceMetrics };

                        // Update action success rates
                        if (hand.lastAction) {
                            const action = hand.lastAction;
                            const success = result === 'win' || result === 'blackjack';

                            if (performanceMetrics.actionSuccess[action]) {
                                performanceMetrics.actionSuccess[action].count++;
                                if (success) {
                                    performanceMetrics.actionSuccess[action].success++;
                                }
                            } else {
                                performanceMetrics.actionSuccess[action] = { count: 1, success: success ? 1 : 0 };
                            }
                        }

                        // Update win rate by dealer card
                        if (hand.dealerUpCard) {
                            const dealerKey = hand.dealerUpCard.value.toString();
                            const winsByDealer = performanceMetrics.winRateByDealer[dealerKey] || 0;
                            const totalByDealer = (performanceMetrics.winRateByHandValue[dealerKey] || 0) + 1;

                            if (result === 'win' || result === 'blackjack') {
                                performanceMetrics.winRateByDealer[dealerKey] = (winsByDealer + 1) / totalByDealer;
                            } else {
                                performanceMetrics.winRateByDealer[dealerKey] = winsByDealer / totalByDealer;
                            }
                        }

                        // Update win rate by hand value
                        if (hand.initialValue) {
                            const handKey = hand.initialValue.toString();
                            const winsByHand = performanceMetrics.winRateByHandValue[handKey] || 0;
                            const totalByHand = (performanceMetrics.winRateByHandValue[handKey] || 0) + 1;

                            if (result === 'win' || result === 'blackjack') {
                                performanceMetrics.winRateByHandValue[handKey] = (winsByHand + 1) / totalByHand;
                            } else {
                                performanceMetrics.winRateByHandValue[handKey] = winsByHand / totalByHand;
                            }
                        }

                        // Update player metrics if optimal play is tracked
                        if (wasOptimalPlay !== undefined) {
                            const accuracy = performanceMetrics.playerPerformanceMetrics.decisionAccuracy;
                            const newAccuracy = (accuracy * state.handsPlayed + (wasOptimalPlay ? 1 : 0)) / totalHands;
                            performanceMetrics.playerPerformanceMetrics.decisionAccuracy = newAccuracy;

                            // Update basic strategy score based on decision accuracy
                            performanceMetrics.skillMetrics.basicStrategy = newAccuracy * 100;
                        }

                        // Return updated state
                        return {
                            ...state,
                            currentSession,
                            handsPlayed: totalHands,
                            handsWon,
                            handsLost,
                            handsPushed,
                            blackjacks,
                            busts,
                            surrenders,
                            doublesWon,
                            doublesLost,
                            splitsWon,
                            splitsLost,
                            winRate,
                            blackjackRate,
                            bustRate,
                            streaks,
                            handAnalytics,
                            heatMapData,
                            performanceMetrics,
                            history: {
                                ...state.history,
                                recentHands
                            }
                        };
                    });

                    // Record event
                    get().recordGameEvent('hand_completed', {
                        handId: hand.id,
                        result,
                        profit,
                        optimal: wasOptimalPlay
                    });
                },

                recordBet: (bet) => {
                    set(state => {
                        // Update session if it exists
                        let currentSession = state.currentSession;
                        if (currentSession && bet.status !== 'pending') {
                            // Only count completed bets
                            currentSession = {
                                ...currentSession,
                                totalWagered: currentSession.totalWagered + bet.amount,
                                totalWon: currentSession.totalWon + (bet.payout || 0)
                            };
                        }

                        // Calculate total bets and average bet
                        const totalBets = state.history.recentBets.length + 1;
                        const totalAmount = state.history.recentBets.reduce((sum, b) => sum + b.amount, 0) + bet.amount;
                        const averageBet = totalAmount / totalBets;

                        // Track biggest win/loss
                        let biggestWin = state.biggestWin;
                        let biggestLoss = state.biggestLoss;

                        if (bet.status === 'won' && bet.payout) {
                            const profit = bet.payout - bet.amount;
                            biggestWin = Math.max(biggestWin, profit);
                        } else if (bet.status === 'lost') {
                            biggestLoss = Math.max(biggestLoss, bet.amount);
                        }

                        // Update bet history
                        const recentBets = [...state.history.recentBets, bet].slice(-50);

                        return {
                            ...state,
                            currentSession,
                            averageBet,
                            biggestWin,
                            biggestLoss,
                            history: {
                                ...state.history,
                                recentBets
                            }
                        };
                    });

                    // Record event
                    get().recordGameEvent('bet_placed', bet);
                },

                recordGameAction: (action) => {
                    set(state => {
                        // Update session if one is active
                        let updatedSession = state.currentSession;
                        if (updatedSession) {
                            updatedSession = {
                                ...updatedSession,
                                gameActions: [...updatedSession.gameActions, action]
                            };
                        }

                        return {
                            ...state,
                            currentSession: updatedSession
                        };
                    });

                    // Record action event
                    get().recordGameEvent('game_action', action);
                },

                recordGameEvent: (type, data) => {
                    const event: GameEvent = {
                        id: uuidv4(),
                        type,
                        timestamp: new Date(),
                        data
                    };

                    set(state => ({
                        ...state,
                        gameEvents: [event, ...state.gameEvents].slice(0, 1000) // Keep last 1000 events
                    }));
                },

                updatePerformanceMetrics: (metrics) => {
                    set(state => ({
                        ...state,
                        performanceMetrics: {
                            ...state.performanceMetrics,
                            skillMetrics: {
                                ...state.performanceMetrics.skillMetrics,
                                ...metrics
                            }
                        }
                    }));
                },

                updatePlayerPerformanceMetrics: (metrics) => {
                    set(state => ({
                        ...state,
                        performanceMetrics: {
                            ...state.performanceMetrics,
                            playerPerformanceMetrics: {
                                ...state.performanceMetrics.playerPerformanceMetrics,
                                ...metrics
                            }
                        }
                    }));
                },

                resetStatistics: () => {
                    // Preserve current session
                    const currentSession = get().currentSession;

                    set({
                        currentSession,
                        sessions: [],
                        gamesPlayed: 0,
                        handsPlayed: 0,
                        totalWagered: 0,
                        totalWon: 0,
                        netProfit: 0,
                        handsWon: 0,
                        handsLost: 0,
                        handsPushed: 0,
                        blackjacks: 0,
                        busts: 0,
                        surrenders: 0,
                        insuranceTaken: 0,
                        insuranceWon: 0,
                        doublesWon: 0,
                        doublesLost: 0,
                        splitsWon: 0,
                        splitsLost: 0,
                        winRate: 0,
                        blackjackRate: 0,
                        bustRate: 0,
                        averageBet: 0,
                        biggestWin: 0,
                        biggestLoss: 0,
                        streaks: {
                            currentWinStreak: 0,
                            currentLoseStreak: 0,
                            longestWinStreak: 0,
                            longestLoseStreak: 0,
                        },
                        handAnalytics: [],
                        gameEvents: [],
                        heatMapData: [],
                        performanceMetrics: {
                            skillMetrics: {
                                basicStrategy: 0,
                                cardCounting: 0,
                                bankrollManagement: 0,
                                disciplineScore: 0,
                                overallSkill: 0,
                            },
                            streaks: {
                                currentWinStreak: 0,
                                currentLoseStreak: 0,
                                longestWinStreak: 0,
                                longestLoseStreak: 0,
                            },
                            winRateByDealer: {},
                            winRateByHandValue: {},
                            actionSuccess: {
                                'hit': { count: 0, success: 0 },
                                'stand': { count: 0, success: 0 },
                                'double': { count: 0, success: 0 },
                                'split': { count: 0, success: 0 },
                                'surrender': { count: 0, success: 0 },
                                'insurance': { count: 0, success: 0 }
                            },
                            playerPerformanceMetrics: {
                                decisionAccuracy: 0,
                                betSizing: 0,
                                consistencyScore: 0,
                                riskManagement: 0,
                                advantagePlayScore: 0
                            }
                        },
                        timeSeriesData: {
                            balance: currentSession ? [
                                { timestamp: currentSession.startTime, value: currentSession.initialBalance }
                            ] : [],
                            winRate: []
                        },
                        history: {
                            gameResults: [],
                            recentHands: [],
                            recentBets: [],
                            recentRounds: []
                        }
                    });
                },

                getWinRate: () => {
                    const state = get();
                    return {
                        winRate: state.winRate,
                        handsPlayed: state.handsPlayed,
                        handsWon: state.handsWon,
                        handsLost: state.handsLost,
                        handsPushed: state.handsPushed,
                        blackjacks: state.blackjacks
                    };
                },

                getPerformanceReport: () => {
                    const state = get();
                    const { performanceMetrics, winRate, blackjackRate, netProfit } = state;

                    // Helper function to get level description
                    const getSkillLevel = (score: number): string => {
                        if (score >= 90) return 'expert';
                        if (score >= 70) return 'advanced';
                        if (score >= 50) return 'intermediate';
                        if (score >= 30) return 'basic';
                        return 'beginner';
                    };

                    // Convert skill metrics to report format
                    const skillMetricsReport = Object.entries(performanceMetrics.skillMetrics).map(([category, score]) => ({
                        category,
                        score,
                        level: getSkillLevel(score)
                    }));

                    // Calculate player level
                    const overallSkill = performanceMetrics.skillMetrics.overallSkill;
                    let playerLevel = getSkillLevel(overallSkill);

                    // Calculate expected value
                    const calculatedEv = -0.005; // Default house edge

                    return {
                        skillMetrics: skillMetricsReport,
                        detailedPerformance: performanceMetrics.playerPerformanceMetrics,
                        streaks: state.streaks,
                        winRate,
                        blackjackRate,
                        totalProfit: netProfit,
                        expectedValue: calculatedEv,
                        playerLevel
                    };
                },

                getHandAnalysis: (handId) => {
                    return get().handAnalytics.find(hand => hand.id === handId);
                },

                getHeatMapAnalysis: () => {
                    return get().heatMapData;
                },

                getSessionAnalysis: (sessionId) => {
                    const { currentSession, sessions } = get();

                    // If no sessionId is provided, analyze current session
                    const session = sessionId
                        ? sessions.find(s => s.id === sessionId)
                        : currentSession;

                    if (!session) {
                        return null;
                    }

                    const duration = session.duration ||
                        (session.endTime
                            ? (session.endTime.getTime() - session.startTime.getTime()) / 1000
                            : (new Date().getTime() - session.startTime.getTime()) / 1000);

                    const averageBet = session.handsPlayed > 0
                        ? session.totalWagered / session.handsPlayed
                        : 0;

                    const handsPerHour = duration > 0
                        ? (session.handsPlayed / duration) * 3600
                        : 0;

                    const profitPerHour = duration > 0
                        ? (session.netProfit / duration) * 3600
                        : 0;

                    return {
                        session,
                        metrics: {
                            duration,
                            averageBet,
                            handsPerHour,
                            profitPerHour,
                            winRate: session.handsPlayed > 0
                                ? get().handsWon / session.handsPlayed
                                : undefined
                        }
                    };
                },

                exportAnalytics: () => {
                    const state = get();
                    const { sessions, currentSession, performanceMetrics, streaks } = state;

                    // Calculate ROI
                    const roi = state.totalWagered > 0
                        ? (state.netProfit / state.totalWagered) * 100
                        : 0;

                    return {
                        summary: {
                            gamesPlayed: state.gamesPlayed,
                            handsPlayed: state.handsPlayed,
                            winRate: state.winRate,
                            blackjackRate: state.blackjackRate,
                            bustRate: state.bustRate,
                            netProfit: state.netProfit,
                            averageBet: state.averageBet,
                            roi
                        },
                        performance: performanceMetrics,
                        streaks,
                        currentSession,
                        sessions,
                        handAnalytics: state.handAnalytics,
                        heatMapData: state.heatMapData,
                        timeSeriesData: state.timeSeriesData,
                        exportDate: new Date()
                    };
                }
            }),
            {
                name: 'blackjack-analytics',
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    // Only persist certain fields to localStorage
                    gamesPlayed: state.gamesPlayed,
                    handsPlayed: state.handsPlayed,
                    totalWagered: state.totalWagered,
                    totalWon: state.totalWon,
                    netProfit: state.netProfit,
                    handsWon: state.handsWon,
                    handsLost: state.handsLost,
                    handsPushed: state.handsPushed,
                    blackjacks: state.blackjacks,
                    busts: state.busts,
                    winRate: state.winRate,
                    blackjackRate: state.blackjackRate,
                    bustRate: state.bustRate,
                    averageBet: state.averageBet,
                    biggestWin: state.biggestWin,
                    biggestLoss: state.biggestLoss,
                    streaks: state.streaks,
                    sessions: state.sessions,
                    history: {
                        gameResults: state.history.gameResults
                    }
                })
            }
        )
    )
);