/**
 * Sophisticated Analytics Store for Blackjack Game
 *
 * This store tracks comprehensive game and player statistics,
 * providing real-time analytics and performance metrics.
 * Implements optimized data structures for efficient storage and retrieval.
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

// Define detailed hand analytics
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

// Define game events for real-time tracking
interface GameEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: GameEventData;
}

// Define a union type for game event data to replace 'any'
type GameEventData =
    | { balance: number }
    | { balance: number; duration: number; profit: number }
    | GameStatistics
    | { handId: string; result: string; profit: number; optimal: boolean }
    | Bet
    | GameAction
    | null;

// Define heat map data for visualizing play patterns
interface HeatMapData {
    playerValue: number;
    dealerValue: number;
    action: HandAction;
    result: string;
    count: number;
}

// Define real-time performance metrics
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
    winRateByDealer: Record<string | number, number>; // Win rate indexed by dealer up card value, including string keys for counts
    winRateByHandValue: Record<string | number, number>; // Win rate indexed by initial hand value, including string keys for counts
    actionSuccess: Record<HandAction, { count: number; success: number }>; // Success rate per action
    playerPerformanceMetrics: PlayerPerformanceMetrics; // Detailed player performance metrics
}

// Define win rate calculation metrics
interface WinRateMetrics {
    winRate: number;
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
}

// Add extended Hand interface definition that includes all needed properties
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

// Analytics Store State
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

// Define return types for methods that previously returned 'any'
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

// Create the Analytics Store with proper type annotation
const useAnalyticsStore = create<AnalyticsStoreState>()(
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

                // Start a new analytics session
                startSession: (initialBalance: number) => {
                    const session: AnalyticsSession = {
                        id: uuidv4(),
                        startTime: new Date(),
                        initialBalance,
                        handsPlayed: 0,
                        roundsPlayed: 0,
                        totalWagered: 0,
                        totalWon: 0,
                        netProfit: 0,
                        gameActions: []
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

                    // Record session start event
                    get().recordGameEvent('session_start', { balance: initialBalance });
                },

                // End the current analytics session
                endSession: (finalBalance: number) => {
                    const { currentSession } = get();

                    if (!currentSession) return;

                    const endTime = new Date();
                    const duration =
                        (endTime.getTime() - currentSession.startTime.getTime()) / 1000;
                    const netProfit = finalBalance - currentSession.initialBalance;

                    const completedSession: AnalyticsSession = {
                        ...currentSession,
                        endTime,
                        finalBalance,
                        duration,
                        netProfit
                    };

                    set(state => ({
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

                    // Record session end event
                    get().recordGameEvent('session_end', {
                        balance: finalBalance,
                        duration,
                        profit: netProfit
                    });
                },

                // Record a completed game
                recordGamePlayed: (gameResult: GameStatistics) => {
                    set(state => {
                        const newGamesPlayed = state.gamesPlayed + 1;
                        const newHandsPlayed = state.handsPlayed + gameResult.handsPlayed;
                        const newTotalWagered = state.totalWagered + (gameResult.averageBet * gameResult.handsPlayed);
                        const newTotalWon = state.totalWon + gameResult.netProfit;
                        const newNetProfit = state.netProfit + gameResult.netProfit;

                        // Update session if one is active
                        let updatedSession = state.currentSession;
                        if (updatedSession) {
                            updatedSession = {
                                ...updatedSession,
                                handsPlayed: updatedSession.handsPlayed + gameResult.handsPlayed,
                                roundsPlayed: updatedSession.roundsPlayed + 1,
                                totalWagered: updatedSession.totalWagered + (gameResult.averageBet * gameResult.handsPlayed),
                                totalWon: updatedSession.totalWon + gameResult.netProfit,
                                netProfit: updatedSession.netProfit + gameResult.netProfit
                            };
                        }

                        // Add to game history
                        const gameHistoryEntry = {
                            gameId: uuidv4(),
                            timestamp: new Date(),
                            profit: gameResult.netProfit,
                            handsPlayed: gameResult.handsPlayed
                        };

                        // Calculate updated win rate
                        const newWinRate =
                            (state.handsWon + gameResult.wins + gameResult.blackjacks) /
                            (newHandsPlayed || 1);

                        // Calculate updated blackjack rate
                        const newBlackjackRate =
                            (state.blackjacks + gameResult.blackjacks) /
                            (newHandsPlayed || 1);

                        // Calculate updated bust rate
                        const newBustRate =
                            (state.busts + gameResult.busts) /
                            (newHandsPlayed || 1);

                        // Calculate new average bet
                        const newAverageBet =
                            newHandsPlayed > 0 ?
                                newTotalWagered / newHandsPlayed :
                                0;

                        return {
                            ...state,
                            gamesPlayed: newGamesPlayed,
                            handsPlayed: newHandsPlayed,
                            totalWagered: newTotalWagered,
                            totalWon: newTotalWon,
                            netProfit: newNetProfit,
                            handsWon: state.handsWon + gameResult.wins + gameResult.blackjacks,
                            handsLost: state.handsLost + gameResult.losses,
                            handsPushed: state.handsPushed + gameResult.pushes,
                            blackjacks: state.blackjacks + gameResult.blackjacks,
                            busts: state.busts + gameResult.busts,
                            surrenders: state.surrenders + gameResult.surrenders,
                            winRate: newWinRate,
                            blackjackRate: newBlackjackRate,
                            bustRate: newBustRate,
                            averageBet: newAverageBet,
                            biggestWin: Math.max(state.biggestWin, gameResult.biggestWin),
                            biggestLoss: Math.min(state.biggestLoss, gameResult.biggestLoss),
                            currentSession: updatedSession,
                            history: {
                                ...state.history,
                                gameResults: [
                                    gameHistoryEntry,
                                    ...state.history.gameResults
                                ].slice(0, 50) // Keep last 50 games
                            },
                            timeSeriesData: {
                                ...state.timeSeriesData,
                                winRate: [
                                    ...state.timeSeriesData.winRate,
                                    { timestamp: new Date(), value: newWinRate }
                                ]
                            }
                        };
                    });

                    // Record game completion event
                    get().recordGameEvent('game_completed', gameResult);
                },

                // Record a hand result
                recordHand: (hand: ExtendedHand, result: string, profit: number, wasOptimalPlay = true, optimalAction?: HandAction) => {
                    set(state => {
                        // Update hand counts and streaks
                        const counts = updateHandCounts(state, hand, result);
                        const streaks = updateStreaks(state, result);

                        // Calculate new statistics
                        const newHandsPlayed = state.handsPlayed + 1;
                        const newWinRate = counts.handsWon / (newHandsPlayed || 1);
                        const newBlackjackRate = counts.blackjacks / (newHandsPlayed || 1);
                        const newBustRate = counts.busts / (newHandsPlayed || 1);

                        // Update profit metrics
                        const newNetProfit = state.netProfit + profit;
                        const newBiggestWin = profit > 0 ? Math.max(state.biggestWin, profit) : state.biggestWin;
                        const newBiggestLoss = profit < 0 ? Math.min(state.biggestLoss, profit) : state.biggestLoss;

                        // Create hand analytics entry
                        const handAnalytic = createHandAnalytic(hand, result, profit, wasOptimalPlay, optimalAction);

                        // Extract values needed for heat map
                        const playerValue = hand.initialValue ?? 0;
                        const dealerValue = hand.dealerUpCard?.value ?? 0;
                        const action = hand.lastAction as HandAction;

                        // Update heat map data
                        const newHeatMapData = updateHeatMapData(state, playerValue, dealerValue, action, result);

                        // Update performance metrics
                        let newPerformanceMetrics = updatePerformanceMetrics(state, hand, result, wasOptimalPlay, action);

                        // Update player metrics
                        newPerformanceMetrics = updatePlayerMetrics(state, hand, wasOptimalPlay, newPerformanceMetrics);

                        // Update risk metrics and overall skill
                        newPerformanceMetrics = updateRiskMetrics(state, hand, newPerformanceMetrics);

                        // Update session if one is active
                        let updatedSession = state.currentSession;
                        if (updatedSession) {
                            updatedSession = {
                                ...updatedSession,
                                handsPlayed: updatedSession.handsPlayed + 1,
                                totalWagered: updatedSession.totalWagered + (hand.bet || 0),
                                totalWon: updatedSession.totalWon + (profit > 0 ? profit : 0),
                                netProfit: updatedSession.netProfit + profit
                            };
                        }

                        return {
                            ...state,
                            handsPlayed: newHandsPlayed,
                            handsWon: counts.handsWon,
                            handsLost: counts.handsLost,
                            handsPushed: counts.handsPushed,
                            blackjacks: counts.blackjacks,
                            busts: counts.busts,
                            surrenders: counts.surrenders,
                            doublesWon: counts.doublesWon,
                            doublesLost: counts.doublesLost,
                            splitsWon: counts.splitsWon,
                            splitsLost: counts.splitsLost,
                            winRate: newWinRate,
                            blackjackRate: newBlackjackRate,
                            bustRate: newBustRate,
                            netProfit: newNetProfit,
                            biggestWin: newBiggestWin,
                            biggestLoss: newBiggestLoss,
                            streaks,
                            performanceMetrics: newPerformanceMetrics,
                            handAnalytics: [handAnalytic, ...state.handAnalytics].slice(0, 500), // Keep last 500 hands
                            heatMapData: newHeatMapData,
                            currentSession: updatedSession,
                            history: {
                                ...state.history,
                                recentHands: [hand, ...state.history.recentHands].slice(0, 20) // Keep last 20 hands
                            }
                        };
                    });

                    // Record hand completion event
                    get().recordGameEvent('hand_completed', {
                        handId: hand.id,
                        result,
                        profit,
                        optimal: wasOptimalPlay
                    });
                },

                // Record a bet
                recordBet: (bet: Bet) => {
                    set(state => {
                        // Update average bet calculation
                        const totalBetsSoFar = state.handsPlayed;
                        const totalBetAmountSoFar = state.averageBet * totalBetsSoFar;
                        const newTotalBetAmount = totalBetAmountSoFar + bet.amount;
                        const newAverageBet = (totalBetsSoFar + 1) > 0 ?
                            newTotalBetAmount / (totalBetsSoFar + 1) :
                            bet.amount;

                        // Update session if one is active
                        let updatedSession = state.currentSession;
                        if (updatedSession) {
                            updatedSession = {
                                ...updatedSession,
                                totalWagered: updatedSession.totalWagered + bet.amount
                            };
                        }

                        return {
                            ...state,
                            totalWagered: state.totalWagered + bet.amount,
                            averageBet: newAverageBet,
                            currentSession: updatedSession,
                            history: {
                                ...state.history,
                                recentBets: [bet, ...state.history.recentBets].slice(0, 20) // Keep last 20 bets
                            }
                        };
                    });

                    // Record bet placed event
                    get().recordGameEvent('bet_placed', bet);
                },

                // Record a game action
                recordGameAction: (action: GameAction) => {
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

                // Record a game event for real-time analysis
                recordGameEvent: (type: string, data: GameEventData) => {
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

                // Update performance metrics
                updatePerformanceMetrics: (metrics) => {
                    set(state => {
                        const updatedMetrics = {
                            ...state.performanceMetrics,
                            skillMetrics: {
                                ...state.performanceMetrics.skillMetrics,
                                ...metrics
                            }
                        };

                        // Recalculate overall skill
                        updatedMetrics.skillMetrics.overallSkill = Math.round(
                            (updatedMetrics.skillMetrics.basicStrategy +
                                updatedMetrics.skillMetrics.cardCounting +
                                updatedMetrics.skillMetrics.bankrollManagement +
                                updatedMetrics.skillMetrics.disciplineScore) / 4
                        );

                        return {
                            ...state,
                            performanceMetrics: updatedMetrics
                        };
                    });
                },

                // Update player performance metrics
                updatePlayerPerformanceMetrics: (metrics: Partial<PlayerPerformanceMetrics>) => {
                    set(state => {
                        const updatedMetrics = {
                            ...state.performanceMetrics,
                            playerPerformanceMetrics: {
                                ...state.performanceMetrics.playerPerformanceMetrics,
                                ...metrics
                            }
                        };

                        // Update skill metrics based on player performance metrics
                        // This provides a bridge between the detailed metrics and the higher-level skill scores
                        if (metrics.decisionAccuracy !== undefined) {
                            updatedMetrics.skillMetrics.basicStrategy =
                                Math.round(metrics.decisionAccuracy * 100);
                        }

                        if (metrics.advantagePlayScore !== undefined) {
                            updatedMetrics.skillMetrics.cardCounting =
                                Math.round(metrics.advantagePlayScore * 100);
                        }

                        if (metrics.betSizing !== undefined && metrics.riskManagement !== undefined) {
                            updatedMetrics.skillMetrics.bankrollManagement =
                                Math.round(((metrics.betSizing + metrics.riskManagement) / 2) * 100);
                        }

                        if (metrics.consistencyScore !== undefined) {
                            updatedMetrics.skillMetrics.disciplineScore =
                                Math.round(metrics.consistencyScore * 100);
                        }

                        // Recalculate overall skill
                        updatedMetrics.skillMetrics.overallSkill = Math.round(
                            (updatedMetrics.skillMetrics.basicStrategy +
                                updatedMetrics.skillMetrics.cardCounting +
                                updatedMetrics.skillMetrics.bankrollManagement +
                                updatedMetrics.skillMetrics.disciplineScore) / 4
                        );

                        return {
                            ...state,
                            performanceMetrics: updatedMetrics
                        };
                    });
                },

                // Reset all statistics
                resetStatistics: () => {
                    // Keep current session, but reset all other statistics
                    const { currentSession } = get();

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

                    // Record reset event
                    get().recordGameEvent('statistics_reset', null);
                },

                // Get win rate metrics
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

                // Get performance metrics for display
                getPerformanceReport: () => {
                    const { performanceMetrics, streaks, winRate, blackjackRate, netProfit } = get();

                    // Calculate player level based on performance
                    const getPlayerLevel = (overallSkill: number) => {
                        if (overallSkill >= 85) return 'expert';
                        if (overallSkill >= 70) return 'advanced';
                        if (overallSkill >= 50) return 'intermediate';
                        return 'beginner';
                    };

                    // Calculate EV (Expected Value) based on performance
                    const calculateEv = () => {
                        // Simplified EV calculation - can be made more sophisticated
                        const houseEdge = 0.005; // 0.5% base house edge
                        const skillAdjustment = (performanceMetrics.skillMetrics.overallSkill - 50) / 1000;
                        return -houseEdge + skillAdjustment;
                    };

                    // Generate skill metrics for UI display
                    const skillMetrics = [
                        {
                            category: 'Basic Strategy',
                            level: getPlayerLevel(performanceMetrics.skillMetrics.basicStrategy),
                            score: performanceMetrics.skillMetrics.basicStrategy
                        },
                        {
                            category: 'Card Counting',
                            level: getPlayerLevel(performanceMetrics.skillMetrics.cardCounting),
                            score: performanceMetrics.skillMetrics.cardCounting
                        },
                        {
                            category: 'Bankroll Management',
                            level: getPlayerLevel(performanceMetrics.skillMetrics.bankrollManagement),
                            score: performanceMetrics.skillMetrics.bankrollManagement
                        },
                        {
                            category: 'Discipline',
                            level: getPlayerLevel(performanceMetrics.skillMetrics.disciplineScore),
                            score: performanceMetrics.skillMetrics.disciplineScore
                        },
                        {
                            category: 'Overall Skill',
                            level: getPlayerLevel(performanceMetrics.skillMetrics.overallSkill),
                            score: performanceMetrics.skillMetrics.overallSkill
                        }
                    ];

                    // Include detailed performance metrics
                    const detailedPerformance = {
                        decisionAccuracy: performanceMetrics.playerPerformanceMetrics.decisionAccuracy,
                        betSizing: performanceMetrics.playerPerformanceMetrics.betSizing,
                        consistencyScore: performanceMetrics.playerPerformanceMetrics.consistencyScore,
                        riskManagement: performanceMetrics.playerPerformanceMetrics.riskManagement,
                        advantagePlayScore: performanceMetrics.playerPerformanceMetrics.advantagePlayScore
                    };

                    return {
                        skillMetrics,
                        detailedPerformance,
                        streaks,
                        winRate,
                        blackjackRate,
                        totalProfit: netProfit,
                        expectedValue: calculateEv(),
                        playerLevel: getPlayerLevel(performanceMetrics.skillMetrics.overallSkill)
                    };
                },

                // Get detailed analysis for a specific hand
                getHandAnalysis: (handId: string) => {
                    return get().handAnalytics.find(hand => hand.id === handId);
                },

                // Get heat map data for strategic analysis
                getHeatMapAnalysis: () => {
                    return get().heatMapData;
                },

                // Get detailed session analysis
                getSessionAnalysis: (sessionId?: string): SessionAnalysis | null => {
                    const state = get();

                    // If no session ID provided, use current session or most recent
                    let targetSession: AnalyticsSession | null = null;

                    if (sessionId) {
                        targetSession = state.sessions.find((s: AnalyticsSession) => s.id === sessionId) || null;
                    } else if (state.currentSession) {
                        targetSession = state.currentSession;
                    } else if (state.sessions.length > 0) {
                        const lastSession = state.sessions[state.sessions.length - 1];
                        if (lastSession) {
                            targetSession = lastSession;
                        }
                    }

                    if (!targetSession) {
                        return null;
                    }

                    // Calculate session metrics
                    const duration = targetSession.duration ??
                        (targetSession.endTime ?
                            (targetSession.endTime.getTime() - targetSession.startTime.getTime()) / 1000 :
                            (new Date().getTime() - targetSession.startTime.getTime()) / 1000);

                    const handsPerHour =
                        duration > 0 ?
                            (targetSession.handsPlayed / duration) * 3600 :
                            0;

                    const profitPerHour =
                        duration > 0 ?
                            (targetSession.netProfit / duration) * 3600 :
                            0;

                    const averageBet =
                        targetSession.handsPlayed > 0 ?
                            targetSession.totalWagered / targetSession.handsPlayed :
                            0;

                    // Calculate win rate for the session if possible
                    let winRate;
                    if (targetSession.handsPlayed > 0) {
                        // This is a simplification - in a real implementation you would track wins per session
                        const storeState = useAnalyticsStore.getState();
                        const allHandsAnalytics = storeState.handAnalytics || [];
                        const sessionWins = allHandsAnalytics
                            .filter((ha: HandAnalytics) => ha.timestamp >= targetSession.startTime &&
                                (!targetSession.endTime || ha.timestamp <= targetSession.endTime))
                            .filter((ha: HandAnalytics) => ha.result === 'win' || ha.result === 'blackjack')
                            .length;

                        winRate = sessionWins / targetSession.handsPlayed;
                    }

                    return {
                        session: targetSession,
                        metrics: {
                            duration,
                            handsPerHour,
                            profitPerHour,
                            averageBet,
                            winRate
                        }
                    };
                },

                // Export all analytics data
                exportAnalytics: () => {
                    const state = get();

                    return {
                        summary: {
                            gamesPlayed: state.gamesPlayed,
                            handsPlayed: state.handsPlayed,
                            winRate: state.winRate,
                            blackjackRate: state.blackjackRate,
                            bustRate: state.bustRate,
                            netProfit: state.netProfit,
                            averageBet: state.averageBet,
                            roi: state.totalWagered > 0 ?
                                (state.netProfit / state.totalWagered) * 100 :
                                0
                        },
                        performance: state.performanceMetrics,
                        streaks: state.streaks,
                        currentSession: state.currentSession,
                        sessions: state.sessions,
                        handAnalytics: state.handAnalytics,
                        heatMapData: state.heatMapData,
                        timeSeriesData: state.timeSeriesData,
                        exportDate: new Date()
                    };
                }
            }),
            {
                name: 'blackjack-analytics-storage',
                storage: createJSONStorage(() => sessionStorage),
                partialize: (state) => ({
                    // Only persist these fields to storage
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
                    surrenders: state.surrenders,
                    winRate: state.winRate,
                    blackjackRate: state.blackjackRate,
                    bustRate: state.bustRate,
                    averageBet: state.averageBet,
                    biggestWin: state.biggestWin,
                    biggestLoss: state.biggestLoss,
                    streaks: state.streaks,
                    sessions: state.sessions,
                    performanceMetrics: state.performanceMetrics
                })
            }
        )
    )
);

// Implementation of hooks for AnalyticsDashboard
export const useWinRate = () => {
    return useAnalyticsStore(state => ({
        winRate: state.winRate,
        handsPlayed: state.handsPlayed,
        handsWon: state.handsWon,
        handsLost: state.handsLost,
        handsPushed: state.handsPushed,
        blackjacks: state.blackjacks,
        weeklyTrend: 0.5 // This would be calculated based on previous data
    }));
};

export const usePerformanceMetrics = () => {
    const { netProfit, streaks, performanceMetrics } = useAnalyticsStore(state => ({
        netProfit: state.netProfit,
        streaks: state.streaks,
        performanceMetrics: state.performanceMetrics
    }));

    // Get player level based on skill metrics
    const playerLevel = (() => {
        const overallSkill = performanceMetrics.skillMetrics.overallSkill;
        if (overallSkill >= 80) return 'expert';
        if (overallSkill >= 60) return 'advanced';
        if (overallSkill >= 40) return 'intermediate';
        return 'beginner';
    })();

    // Calculate expected value based on skill level
    const expectedValue = (() => {
        const baseHouseEdge = -0.005; // Standard blackjack house edge
        const skillBonus = (performanceMetrics.skillMetrics.overallSkill - 50) / 1000;
        return baseHouseEdge + skillBonus;
    })();

    // Map skill metrics to the format expected by the dashboard
    const skillMetrics = [
        {
            category: 'Basic Strategy',
            level: getSkillLevel(performanceMetrics.skillMetrics.basicStrategy)
        },
        {
            category: 'Card Counting',
            level: getSkillLevel(performanceMetrics.skillMetrics.cardCounting)
        },
        {
            category: 'Bankroll Management',
            level: getSkillLevel(performanceMetrics.skillMetrics.bankrollManagement)
        },
        {
            category: 'Discipline',
            level: getSkillLevel(performanceMetrics.skillMetrics.disciplineScore)
        }
    ];

    // Determine bankroll status
    const trends = { profitTrend: 0 };

    // Extract nested ternary into a separate variable
    let statusValue;
    if (trends.profitTrend > 0) {
        statusValue = 'increasing';
    } else if (trends.profitTrend < 0) {
        statusValue = 'declining';
    } else {
        statusValue = 'stable';
    }

    const bankrollStatus = {
        status: statusValue
    };

    // Map action success data
    type ActionSuccessData = { success: number; count: number };
    const actionSuccessData = Object.entries(performanceMetrics.actionSuccess).reduce<Record<string, { success: number; count: number; optimal?: number }>>((acc, [action, data]) => {
        const successData = data as ActionSuccessData;
        acc[action] = {
            success: successData.success,
            count: successData.count,
            optimal: Math.floor(successData.count * 0.9) // Placeholder for optimal count
        };
        return acc;
    }, {});

    return {
        totalProfit: netProfit,
        recentTrend: trends.profitTrend,
        streaks: {
            longestWinStreak: streaks.longestWinStreak,
            currentWinStreak: streaks.currentWinStreak,
            currentLoseStreak: streaks.currentLoseStreak,
            longestLoseStreak: streaks.longestLoseStreak
        },
        bankrollStatus,
        skillMetrics,
        playerLevel,
        expectedValue,
        actionSuccess: actionSuccessData
    };
};

// Helper function to determine skill level
const getSkillLevel = (score: number): string => {
    if (score >= 80) return 'expert';
    if (score >= 60) return 'advanced';
    if (score >= 40) return 'intermediate';
    return 'beginner';
};

export const useSessionMetrics = (sessionId?: string) => {
    const { currentSession, sessions } = useAnalyticsStore(state => ({
        currentSession: state.currentSession,
        sessions: state.sessions
    }));

    // Get the target session (current or specified by ID)
    const targetSession = sessionId
        ? sessions.find((s: AnalyticsSession) => s.id === sessionId)
        : currentSession;

    if (!targetSession) {
        return {};
    }

    const duration = targetSession.duration ??
        (targetSession.endTime
            ? (targetSession.endTime.getTime() - targetSession.startTime.getTime()) / 1000
            : (new Date().getTime() - targetSession.startTime.getTime()) / 1000);

    // Calculate metrics
    const handsPerHour = targetSession.handsPlayed > 0 && duration > 0
        ? (targetSession.handsPlayed / (duration / 3600))
        : 0;

    const profitPerHour = duration > 0
        ? (targetSession.netProfit / (duration / 3600))
        : 0;

    const averageBet = targetSession.handsPlayed > 0
        ? targetSession.totalWagered / targetSession.handsPlayed
        : 0;

    // Calculate win rate for the session if possible
    let winRate;
    if (targetSession.handsPlayed > 0) {
        // This is a simplification - in a real implementation you would track wins per session
        const storeState = useAnalyticsStore.getState();
        const allHandsAnalytics = storeState.handAnalytics || [];
        const sessionWins = allHandsAnalytics
            .filter((ha: HandAnalytics) => ha.timestamp >= targetSession.startTime &&
                (!targetSession.endTime || ha.timestamp <= targetSession.endTime))
            .filter((ha: HandAnalytics) => ha.result === 'win' || ha.result === 'blackjack')
            .length;

        winRate = sessionWins / targetSession.handsPlayed;
    }

    return {
        session: {
            id: targetSession.id,
            startTime: targetSession.startTime,
            handsPlayed: targetSession.handsPlayed,
            netProfit: targetSession.netProfit
        },
        metrics: {
            duration,
            averageBet,
            handsPerHour,
            profitPerHour,
            winRate
        }
    };
};

export const useStrategyHeatMap = () => {
    const { heatMapData } = useAnalyticsStore(state => ({
        heatMapData: state.heatMapData
    }));

    // Map heat map data to the format expected by the dashboard
    return heatMapData.map((data: HeatMapData) => ({
        playerValue: data.playerValue,
        dealerCard: data.dealerValue,
        action: data.action as string, // Cast to string to match HeatMapEntry
        result: data.result,
        count: data.count
    }));
};

// Create a hook to access player performance metrics
export const usePlayerPerformanceMetrics = () => {
    const { playerPerformanceMetrics } = useAnalyticsStore(state => ({
        playerPerformanceMetrics: state.performanceMetrics.playerPerformanceMetrics
    }));

    return {
        ...playerPerformanceMetrics,
        // Add derived metrics if needed
        overallPerformance: (
            playerPerformanceMetrics.decisionAccuracy +
            playerPerformanceMetrics.betSizing +
            playerPerformanceMetrics.consistencyScore +
            playerPerformanceMetrics.riskManagement +
            playerPerformanceMetrics.advantagePlayScore
        ) / 5
    };
};

export default useAnalyticsStore;

// Helper functions for recordHand to reduce complexity
const updateHandCounts = (state: AnalyticsStoreState, hand: ExtendedHand, result: string) => {
    const counts = {
        handsWon: state.handsWon,
        handsLost: state.handsLost,
        handsPushed: state.handsPushed,
        blackjacks: state.blackjacks,
        busts: state.busts,
        surrenders: state.surrenders,
        doublesWon: state.doublesWon,
        doublesLost: state.doublesLost,
        splitsWon: state.splitsWon,
        splitsLost: state.splitsLost
    };

    // Simplify with a switch statement
    switch (result) {
        case 'win':
            counts.handsWon++;
            if (hand.isDoubled) counts.doublesWon++;
            if (hand.isSplit) counts.splitsWon++;
            break;

        case 'blackjack':
            counts.handsWon++;
            counts.blackjacks++;
            if (hand.isDoubled) counts.doublesWon++;
            if (hand.isSplit) counts.splitsWon++;
            break;

        case 'loss':
            counts.handsLost++;
            if (hand.isBusted) counts.busts++;
            if (hand.isDoubled) counts.doublesLost++;
            if (hand.isSplit) counts.splitsLost++;
            break;

        case 'push':
            counts.handsPushed++;
            break;

        case 'surrender':
            counts.handsLost++;
            counts.surrenders++;
            break;
    }

    return counts;
};

const updateStreaks = (state: AnalyticsStoreState, result: string) => {
    const streaks = { ...state.streaks };
    const isWin = result === 'win' || result === 'blackjack';
    const isLoss = result === 'loss' || result === 'surrender';

    // Handle wins
    if (isWin) {
        streaks.currentWinStreak++;
        streaks.currentLoseStreak = 0;
        streaks.longestWinStreak = Math.max(streaks.longestWinStreak, streaks.currentWinStreak);
    }

    // Handle losses
    else if (isLoss) {
        streaks.currentLoseStreak++;
        streaks.currentWinStreak = 0;
        streaks.longestLoseStreak = Math.max(streaks.longestLoseStreak, streaks.currentLoseStreak);
    }

    return streaks;
};

const createHandAnalytic = (hand: ExtendedHand, result: string, profit: number, wasOptimalPlay: boolean, optimalAction?: HandAction): HandAnalytics => {
    return {
        id: hand.id,
        playerId: hand.playerId ?? '',
        cards: hand.cards.map(card => `${card.rank}${card.suit}`),
        initialValue: hand.initialValue ?? 0,
        finalValue: hand.values[0] ?? 0,
        dealerUpCard: hand.dealerUpCard ? `${hand.dealerUpCard.rank}${hand.dealerUpCard.suit}` : undefined,
        result: result as ('win' | 'loss' | 'push' | 'blackjack' | 'surrender'),
        action: hand.lastAction ?? 'stand',
        optimalAction,
        wasOptimalPlay,
        profit,
        timestamp: new Date()
    };
};

const updateHeatMapData = (state: AnalyticsStoreState, playerValue: number, dealerValue: number, action: HandAction, result: string) => {
    // Create new map with updated counts
    const newHeatMapData = [...state.heatMapData];
    const existingIndex = newHeatMapData.findIndex(entry =>
        entry.playerValue === playerValue &&
        entry.dealerValue === dealerValue &&
        entry.action === action &&
        entry.result === result
    );

    if (existingIndex >= 0) {
        // Update existing entry
        const existingEntry = newHeatMapData[existingIndex];

        if (existingEntry) {
            const updatedEntry: HeatMapData = {
                playerValue: existingEntry.playerValue,
                dealerValue: existingEntry.dealerValue,
                action: existingEntry.action,
                result: existingEntry.result,
                count: existingEntry.count + 1
            };
            newHeatMapData[existingIndex] = updatedEntry;
        }
    } else {
        // Add new entry
        newHeatMapData.push({ playerValue, dealerValue, action, result, count: 1 });
    }

    return newHeatMapData;
};

const updatePerformanceMetrics = (state: AnalyticsStoreState, hand: ExtendedHand, result: string, wasOptimalPlay: boolean, action: HandAction) => {
    const newPerformanceMetrics = { ...state.performanceMetrics };
    const isWin = result === 'win' || result === 'blackjack';
    const dealerValue = hand.dealerUpCard?.value ?? 0;
    const playerValue = hand.initialValue ?? 0;

    // Update action success rate
    if (action && newPerformanceMetrics.actionSuccess[action]) {
        const actionData = newPerformanceMetrics.actionSuccess[action];
        newPerformanceMetrics.actionSuccess[action] = {
            count: actionData.count + 1,
            success: actionData.success + (isWin ? 1 : 0)
        };
    }

    // Update win rate by dealer card
    if (dealerValue) {
        const currentRate = newPerformanceMetrics.winRateByDealer[dealerValue] ?? 0;
        const currentCount = newPerformanceMetrics.winRateByDealer[`${dealerValue}_count`] ?? 0;

        newPerformanceMetrics.winRateByDealer[dealerValue] =
            (currentRate * currentCount + (isWin ? 1 : 0)) / (currentCount + 1);
        newPerformanceMetrics.winRateByDealer[`${dealerValue}_count`] = currentCount + 1;
    }

    // Update win rate by player hand value
    if (playerValue) {
        const currentRate = newPerformanceMetrics.winRateByHandValue[playerValue] ?? 0;
        const currentCount = newPerformanceMetrics.winRateByHandValue[`${playerValue}_count`] ?? 0;

        newPerformanceMetrics.winRateByHandValue[playerValue] =
            (currentRate * currentCount + (isWin ? 1 : 0)) / (currentCount + 1);
        newPerformanceMetrics.winRateByHandValue[`${playerValue}_count`] = currentCount + 1;
    }

    return newPerformanceMetrics;
};

const updatePlayerMetrics = (state: AnalyticsStoreState, hand: ExtendedHand, wasOptimalPlay: boolean, performanceMetrics: PerformanceMetrics) => {
    const newPerformanceMetrics = { ...performanceMetrics };

    // Update basic strategy accuracy
    const totalOptimalDecisions = state.handAnalytics.filter(h => h.wasOptimalPlay).length;
    const totalDecisions = state.handAnalytics.length;

    let currentOptimalDecisions = totalOptimalDecisions;
    if (wasOptimalPlay) {
        currentOptimalDecisions += 1;
    }

    let optimalPlayRate;
    if (totalDecisions > 0) {
        optimalPlayRate = currentOptimalDecisions / (totalDecisions + 1);
    } else {
        optimalPlayRate = wasOptimalPlay ? 1 : 0;
    }

    newPerformanceMetrics.skillMetrics.basicStrategy = Math.round(optimalPlayRate * 100);
    newPerformanceMetrics.playerPerformanceMetrics.decisionAccuracy = optimalPlayRate;

    // Update bet sizing metric
    if (hand.bet) {
        const bankroll = state.currentSession?.initialBalance ?? 1000;
        let betRatio = 0;

        if (typeof hand.bet === 'number') {
            betRatio = hand.bet / bankroll;
        } else if (typeof hand.bet === 'object' && hand.bet && 'amount' in hand.bet) {
            betRatio = (hand.bet as { amount: number }).amount / bankroll;
        }

        const betSizingScore = betRatio <= 0.05 ?
            Math.min(1, Math.max(0, 1 - Math.abs(0.025 - betRatio) / 0.025)) :
            Math.max(0, 1 - (betRatio - 0.05) / 0.1);

        newPerformanceMetrics.playerPerformanceMetrics.betSizing =
            0.7 * newPerformanceMetrics.playerPerformanceMetrics.betSizing + 0.3 * betSizingScore;
    }

    // Update consistency score
    if (state.handAnalytics.length > 0) {
        const recentHands = state.handAnalytics.slice(0, Math.min(20, state.handAnalytics.length));
        const recentOptimalPlays = recentHands.filter(h => h.wasOptimalPlay).length;
        const shortTermConsistency = recentOptimalPlays / recentHands.length;

        newPerformanceMetrics.playerPerformanceMetrics.consistencyScore =
            0.8 * newPerformanceMetrics.playerPerformanceMetrics.consistencyScore + 0.2 * shortTermConsistency;
    }

    return newPerformanceMetrics;
};

const updateRiskMetrics = (state: AnalyticsStoreState, hand: ExtendedHand, performanceMetrics: PerformanceMetrics) => {
    const newPerformanceMetrics = { ...performanceMetrics };

    // Update risk management
    if (state.history.recentBets.length > 0) {
        let handBetAmount = 0;

        if (typeof hand.bet === 'number') {
            handBetAmount = hand.bet;
        } else if (typeof hand.bet === 'object' && hand.bet && 'amount' in hand.bet) {
            handBetAmount = (hand.bet as { amount: number }).amount;
        }

        const recentBets = state.history.recentBets.slice(0, Math.min(10, state.history.recentBets.length));
        const betAmounts = [handBetAmount, ...recentBets.map(b => b.amount)];
        const avgBet = betAmounts.reduce((sum, amount) => sum + amount, 0) / betAmounts.length;

        const variance = betAmounts.reduce((sum, amount) => sum + Math.pow(amount - avgBet, 2), 0) / betAmounts.length;
        const normalizedVariance = Math.min(1, variance / (avgBet * avgBet));

        const optimalVariance = 0.2;
        const riskScore = 1 - Math.abs(normalizedVariance - optimalVariance) / Math.max(1, optimalVariance);

        newPerformanceMetrics.playerPerformanceMetrics.riskManagement =
            0.75 * newPerformanceMetrics.playerPerformanceMetrics.riskManagement + 0.25 * riskScore;
    }

    // Update advantage play score
    if (state.history.recentBets.length > 1 && state.history.recentHands.length > 1) {
        const recentResults = state.handAnalytics.slice(0, Math.min(10, state.handAnalytics.length));
        const winningHands = recentResults.filter(h => h.result === 'win' || h.result === 'blackjack').length;
        const winRate = recentResults.length > 0 ? winningHands / recentResults.length : 0;

        const betToWinCorrelation = winRate > 0.5 ? 0.7 : 0.3;

        newPerformanceMetrics.playerPerformanceMetrics.advantagePlayScore =
            0.85 * newPerformanceMetrics.playerPerformanceMetrics.advantagePlayScore + 0.15 * betToWinCorrelation;
    }

    // Update overall skill
    newPerformanceMetrics.skillMetrics.overallSkill = Math.round(
        (newPerformanceMetrics.skillMetrics.basicStrategy +
            newPerformanceMetrics.skillMetrics.cardCounting +
            newPerformanceMetrics.skillMetrics.bankrollManagement +
            newPerformanceMetrics.skillMetrics.disciplineScore) / 4
    );

    return newPerformanceMetrics;
};