import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AnalyticsStore } from '@/types/storeTypes';
import type { GameStatistics } from '@/types/gameTypes';
import type { Hand } from '@/types/handTypes';
import type { Bet } from '@/types/betTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Decision record to track player decisions and outcomes
 */
interface DecisionRecord {
    playerHand: Hand;
    dealerUpCard: unknown; // Fixed 'any' type
    decision: string;
    recommendedDecision: string;
    outcome: 'win' | 'loss' | 'push' | 'pending';
    betAmount: number;
    finalChips: number;
    effectiveCount: number;
    deckPenetration: number;
}

/**
 * Bet record to track betting decisions
 */
interface BetRecord {
    amount: number;
    recommendedAmount: number | null;
    followedRecommendation: boolean;
    effectiveCount: number;
    deckPenetration: number;
    reason: string | null;
}

/**
 * Analytics store to track game statistics and player performance
 */
const useAnalyticsStore = create<AnalyticsStore & {
    gameStats: {
        handsPlayed: number;
        handsWon: number;
        handsLost: number;
        pushes: number;
        netProfit: number;
    };
    decisions: DecisionRecord[];
    bets: BetRecord[];
    sessionStartChips: number;
    sessionActive: boolean;
    startSession: (initialChips: number) => void;
    endSession: (finalChips: number) => void;
    recordDecision: (decision: DecisionRecord) => void;
    recordBet: (bet: BetRecord | Bet) => void;
}>()(
    devtools(
        persist(
            (set, get) => ({
                // AnalyticsStore interface implementation
                gamesPlayed: 0,
                handsPlayed: 0,
                totalWagered: 0,
                totalWon: 0,
                netProfit: 0,
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
                    longestLoseStreak: 0
                },
                history: {
                    gameResults: [],
                    recentHands: [],
                    recentBets: []
                },

                // Additional stats for the UI
                gameStats: {
                    handsPlayed: 0,
                    handsWon: 0,
                    handsLost: 0,
                    pushes: 0,
                    netProfit: 0
                },

                // Session tracking
                decisions: [],
                bets: [],
                sessionStartChips: 0,
                sessionActive: false,

                // Start a new analytics session
                startSession: (initialChips) => {
                    set({
                        sessionStartChips: initialChips,
                        sessionActive: true,
                        gameStats: {
                            handsPlayed: 0,
                            handsWon: 0,
                            handsLost: 0,
                            pushes: 0,
                            netProfit: 0
                        },
                        decisions: [],
                        bets: []
                    });
                },

                // End the current analytics session
                endSession: (finalChips) => {
                    const state = get();
                    const profit = finalChips - state.sessionStartChips;

                    set((state) => ({
                        sessionActive: false,
                        gamesPlayed: state.gamesPlayed + 1,
                        netProfit: state.netProfit + profit,
                        history: {
                            ...state.history,
                            gameResults: [
                                ...state.history.gameResults,
                                {
                                    gameId: uuidv4(),
                                    timestamp: new Date(),
                                    profit,
                                    handsPlayed: state.gameStats.handsPlayed
                                }
                            ]
                        }
                    }));
                },

                // Record a player's decision and its outcome
                recordDecision: (decision) => {
                    set((state) => ({
                        decisions: [...state.decisions, decision]
                    }));

                    // If the decision has a final outcome, update stats
                    if (decision.outcome !== 'pending') {
                        set((state) => {
                            const isWin = decision.outcome === 'win';
                            const isLoss = decision.outcome === 'loss';
                            const isPush = decision.outcome === 'push';

                            // Update streaks
                            const currentWinStreak = isWin ? state.streaks.currentWinStreak + 1 : 0;
                            const currentLoseStreak = isLoss ? state.streaks.currentLoseStreak + 1 : 0;

                            // Calculate profit change
                            let profitChange = 0;
                            if (isWin) {
                                profitChange = decision.betAmount;
                            } else if (isLoss) {
                                profitChange = -decision.betAmount;
                            }

                            return {
                                handsPlayed: state.handsPlayed + 1,
                                gameStats: {
                                    ...state.gameStats,
                                    handsPlayed: state.gameStats.handsPlayed + 1,
                                    handsWon: state.gameStats.handsWon + (isWin ? 1 : 0),
                                    handsLost: state.gameStats.handsLost + (isLoss ? 1 : 0),
                                    pushes: state.gameStats.pushes + (isPush ? 1 : 0),
                                    netProfit: state.gameStats.netProfit + profitChange
                                },
                                streaks: {
                                    currentWinStreak,
                                    currentLoseStreak,
                                    longestWinStreak: Math.max(state.streaks.longestWinStreak, currentWinStreak),
                                    longestLoseStreak: Math.max(state.streaks.longestLoseStreak, currentLoseStreak)
                                },
                                history: {
                                    ...state.history,
                                    recentHands: [
                                        decision.playerHand,
                                        ...state.history.recentHands
                                    ].slice(0, 20) // Keep only the 20 most recent hands
                                }
                            };
                        });
                    }
                },

                // Record a bet - unified version handling both BetRecord and Bet types
                recordBet: (bet) => {
                    // Update bets array if it's a BetRecord
                    if ('recommendedAmount' in bet) {
                        set((state) => ({
                            bets: [...state.bets, bet],
                            totalWagered: state.totalWagered + bet.amount,
                            averageBet: (state.totalWagered + bet.amount) / (state.bets.length + 1)
                        }));
                    } else {
                        // It's a Bet type, update history and other metrics
                        set((state) => ({
                            totalWagered: state.totalWagered + bet.amount,
                            averageBet: (state.totalWagered + bet.amount) / (state.handsPlayed + 1),
                            history: {
                                ...state.history,
                                recentBets: [bet, ...state.history.recentBets].slice(0, 20)
                            }
                        }));
                    }
                },

                // Record completed game
                recordGamePlayed: (gameResult: GameStatistics) => {
                    set((state) => ({
                        gamesPlayed: state.gamesPlayed + 1,
                        netProfit: state.netProfit + gameResult.netProfit,
                        winRate: (state.winRate * state.gamesPlayed + gameResult.winRate) / (state.gamesPlayed + 1),
                        blackjackRate: (state.blackjackRate * state.gamesPlayed + gameResult.blackjacks / gameResult.handsPlayed) / (state.gamesPlayed + 1),
                        bustRate: (state.bustRate * state.gamesPlayed + gameResult.busts / gameResult.handsPlayed) / (state.gamesPlayed + 1)
                    }));
                },

                // Record a completed hand
                recordHand: (hand: Hand, result: string, profit: number) => {
                    set((state) => {
                        const isWin = result === 'win' || result === 'blackjack';
                        const isLoss = result === 'loss' || result === 'bust';

                        return {
                            handsPlayed: state.handsPlayed + 1,
                            totalWon: state.totalWon + (isWin ? profit : 0),
                            netProfit: state.netProfit + profit,
                            biggestWin: isWin && profit > state.biggestWin ? profit : state.biggestWin,
                            biggestLoss: isLoss && -profit > state.biggestLoss ? -profit : state.biggestLoss,
                            history: {
                                ...state.history,
                                recentHands: [hand, ...state.history.recentHands].slice(0, 20)
                            }
                        };
                    });
                },

                // Reset all statistics
                resetStatistics: () => {
                    set({
                        gamesPlayed: 0,
                        handsPlayed: 0,
                        totalWagered: 0,
                        totalWon: 0,
                        netProfit: 0,
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
                            longestLoseStreak: 0
                        },
                        history: {
                            gameResults: [],
                            recentHands: [],
                            recentBets: []
                        },
                        gameStats: {
                            handsPlayed: 0,
                            handsWon: 0,
                            handsLost: 0,
                            pushes: 0,
                            netProfit: 0
                        },
                        decisions: [],
                        bets: [],
                        sessionActive: false
                    });
                }
            }),
            {
                name: 'analytics-storage',
                version: 1,
                partialize: (state) => ({
                    gamesPlayed: state.gamesPlayed,
                    handsPlayed: state.handsPlayed,
                    totalWagered: state.totalWagered,
                    totalWon: state.totalWon,
                    netProfit: state.netProfit,
                    winRate: state.winRate,
                    blackjackRate: state.blackjackRate,
                    bustRate: state.bustRate,
                    averageBet: state.averageBet,
                    biggestWin: state.biggestWin,
                    biggestLoss: state.biggestLoss,
                    streaks: state.streaks,
                    history: state.history,
                    gameStats: state.gameStats
                })
            }
        )
    )
);

export { useAnalyticsStore };