'use client';

/**
 * Core betting store for managing betting operations
 */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
    Bet,
    SideBet,
    TableLimits,
    BettingStrategy,
    ProgressiveBetting
} from '@/types/betTypes';
import {
    DEFAULT_TABLE_LIMITS,
    DEFAULT_PROGRESSIVE_BETTING,
    AVAILABLE_SIDE_BETS
} from '@/lib/constants/betConfig';
import type { ValidationError } from '@/types/utilTypes';

// Define the store state interface
interface BettingStore {
    // Core bet state
    bets: Bet[];
    currentBet: number;
    minBet: number;
    maxBet: number;
    tableLimits: TableLimits;
    bettingStrategy: BettingStrategy | null;
    progressiveBetting: ProgressiveBetting;

    // Side-bet state
    availableSideBets: Array<{
        name: string;
        displayName: string;
        minBet: number;
        maxBet: number;
        payouts: Record<string, number>;
    }>;
    activeSideBets: SideBet[];
    sideBetHistory: SideBet[];
    sideBetStatistics: {
        totalSideBetsPlaced: number;
        totalSideBetAmount: number;
        sideBetWins: number;
        sideBetLosses: number;
        totalSideBetPayouts: number;
        netProfit: number;
        winRate: number;
        typeStats: Record<string, {
            betsPlaced: number;
            totalAmount: number;
            wins: number;
            losses: number;
            totalPayouts: number;
            roi: number;
        }>;
    };

    // Validation methods
    canPlace: (amount: number) => boolean;
    validate: (amount: number) => ValidationError | null;

    // Core actions
    placeBet: (playerId: string, amount: number) => Bet;
    placeSideBet: (playerId: string, handId: string, type: string, amount: number) => SideBet;
    updateBet: (betId: string, amount: number) => void;
    removeBet: (betId: string) => void;
    clearBets: () => void;
    settleBet: (betId: string, result: string) => number;
    calculateNextBet: () => number;

    // Side-bet actions
    evaluateSideBets: (dealerHand: any, playerHands: any[]) => any[];
    clearSideBets: () => void;
    getRecommendedSideBets: (playerHand: any, dealerUpCard: any) => Array<{ type: string; confidence: number }>;
    resetStatistics: () => void;
}

/**
 * Create the betting store
 */
export const useBettingStore = create<BettingStore>((set, get) => ({
    // Core bet state
    bets: [],
    currentBet: 0,
    minBet: DEFAULT_TABLE_LIMITS.minimumBet,
    maxBet: DEFAULT_TABLE_LIMITS.maximumBet,
    tableLimits: DEFAULT_TABLE_LIMITS,
    bettingStrategy: null,
    progressiveBetting: DEFAULT_PROGRESSIVE_BETTING,

    // Side-bet state
    availableSideBets: AVAILABLE_SIDE_BETS,
    activeSideBets: [],
    sideBetHistory: [],
    sideBetStatistics: {
        totalSideBetsPlaced: 0,
        totalSideBetAmount: 0,
        sideBetWins: 0,
        sideBetLosses: 0,
        totalSideBetPayouts: 0,
        netProfit: 0,
        winRate: 0,
        typeStats: {}
    },

    // Validation methods
    canPlace: (amount: number) => {
        const { tableLimits } = get();
        const { minimumBet, maximumBet } = tableLimits;

        return amount >= minimumBet && amount <= maximumBet;
    },

    validate: (amount: number): ValidationError | null => {
        const { tableLimits } = get();
        const { minimumBet, maximumBet } = tableLimits;

        if (amount < minimumBet) {
            return {
                field: 'amount',
                message: `Bet must be at least ${minimumBet}`,
                code: 'MIN_BET'
            };
        }

        if (amount > maximumBet) {
            return {
                field: 'amount',
                message: `Bet cannot exceed ${maximumBet}`,
                code: 'MAX_BET'
            };
        }

        return null;
    },

    // Core actions
    placeBet: (playerId: string, amount: number) => {
        const { tableLimits } = get();

        // Validate bet amount
        if (amount < tableLimits.minimumBet) {
            throw new Error(`Bet must be at least ${tableLimits.minimumBet}`);
        }

        if (amount > tableLimits.maximumBet) {
            throw new Error(`Bet cannot exceed ${tableLimits.maximumBet}`);
        }

        // Create a new bet
        const bet: Bet = {
            id: uuidv4(),
            playerId,
            amount,
            status: 'pending',
            handId: '', // Will be set when hand is created
            timestamp: new Date()
        };

        // Add bet to the store
        set(state => ({
            bets: [...state.bets, bet],
            currentBet: amount
        }));

        return bet;
    },

    placeSideBet: (playerId: string, handId: string, type: string, amount: number) => {
        const available = get().availableSideBets.find(b => b.name === type);

        if (!available) {
            throw new Error(`Side bet type '${type}' is not available`);
        }

        if (amount < available.minBet || amount > available.maxBet) {
            throw new Error(`Side bet amount must be between ${available.minBet} and ${available.maxBet}`);
        }

        const betId = uuidv4();
        const sideBet: SideBet = {
            id: betId,
            type,
            handId,
            playerId,
            amount,
            status: 'pending',
            payout: 0,
            payoutMultiplier: 0,
            timestamp: new Date()
        };

        set(state => {
            // Update history and stats
            const stats = { ...state.sideBetStatistics };
            stats.totalSideBetsPlaced++;
            stats.totalSideBetAmount += amount;
            stats.typeStats[type] = stats.typeStats[type] || {
                betsPlaced: 0,
                totalAmount: 0,
                wins: 0,
                losses: 0,
                totalPayouts: 0,
                roi: 0
            };
            stats.typeStats[type].betsPlaced++;
            stats.typeStats[type].totalAmount += amount;

            return {
                activeSideBets: [...state.activeSideBets, sideBet],
                sideBetStatistics: stats
            };
        });

        return sideBet;
    },

    updateBet: (betId: string, amount: number) => {
        set(state => {
            const betIndex = state.bets.findIndex(b => b.id === betId);

            if (betIndex === -1) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            const bet = state.bets[betIndex];
            if (!bet) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            // Validate bet amount
            if (amount < state.tableLimits.minimumBet) {
                throw new Error(`Bet must be at least ${state.tableLimits.minimumBet}`);
            }

            if (amount > state.tableLimits.maximumBet) {
                throw new Error(`Bet cannot exceed ${state.tableLimits.maximumBet}`);
            }

            // Ensure bet is pending (not already in play)
            if (bet.status !== 'pending') {
                throw new Error('Cannot update bet that is already in play');
            }

            // Update the bet
            const updatedBets = [...state.bets];
            updatedBets[betIndex] = {
                ...bet,
                amount
            };

            return {
                bets: updatedBets,
                currentBet: amount
            };
        });
    },

    removeBet: (betId: string) => {
        set(state => {
            const betIndex = state.bets.findIndex(b => b.id === betId);

            if (betIndex === -1) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            const bet = state.bets[betIndex];

            // Ensure bet is pending (not already in play)
            if (bet.status !== 'pending') {
                throw new Error('Cannot remove bet that is already in play');
            }

            // Remove the bet
            const updatedBets = [...state.bets];
            updatedBets.splice(betIndex, 1);

            return {
                bets: updatedBets,
                currentBet: 0
            };
        });
    },

    clearBets: () => {
        set(state => {
            // Only clear pending bets
            const completedBets = state.bets.filter(
                bet => bet.status !== 'pending'
            );

            return {
                bets: completedBets,
                currentBet: 0
            };
        });
    },

    settleBet: (betId: string, result: string) => {
        set(state => {
            const betIndex = state.bets.findIndex(b => b.id === betId);

            if (betIndex === -1) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            const bet = state.bets[betIndex];
            if (!bet) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            // Calculate payout based on result
            let payout = 0;
            let payoutMultiplier = 0;
            let status: 'won' | 'lost' | 'push' | 'cancelled' | 'surrendered' | 'pending' = 'pending';

            switch (result) {
                case 'win':
                    payoutMultiplier = 1; // 1:1 for regular win
                    payout = bet.amount * 2; // Original bet + winnings
                    status = 'won';
                    break;

                case 'blackjack':
                    payoutMultiplier = 1.5; // 3:2 for blackjack
                    payout = bet.amount * 2.5; // Original bet + winnings
                    status = 'won';
                    break;

                case 'push':
                    payoutMultiplier = 0; // No winnings
                    payout = bet.amount; // Return original bet
                    status = 'push';
                    break;

                case 'loss':
                    payoutMultiplier = -1; // Lose bet
                    payout = 0; // No return
                    status = 'lost';
                    break;

                case 'surrender':
                    payoutMultiplier = -0.5; // Lose half bet
                    payout = bet.amount / 2; // Return half of original bet
                    status = 'surrendered';
                    break;

                case 'insurance':
                    payoutMultiplier = 2; // 2:1 for insurance
                    payout = bet.amount * 3; // Original bet + winnings
                    status = 'won';
                    break;

                default:
                    throw new Error(`Invalid result: ${result}`);
            }

            // Update the bet
            const updatedBets = [...state.bets];
            updatedBets[betIndex] = {
                ...bet,
                status,
                payout,
                payoutMultiplier
            };

            return {
                bets: updatedBets
            };
        });

        // Return the payout
        return get().bets.find(b => b.id === betId)?.payout || 0;
    },

    calculateNextBet: () => {
        const { currentBet, bets, progressiveBetting, tableLimits, bettingStrategy } = get();

        // If progressive betting is not enabled, return current bet or minimum bet
        if (!progressiveBetting.enabled) {
            return currentBet || tableLimits.minimumBet;
        }

        // Get last bet result
        const lastBet = [...bets].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        // If no previous bets, use base bet
        if (!lastBet) {
            return progressiveBetting.baseBet;
        }

        // Determine initial bet value based on last result
        let nextBet;
        if (lastBet.status === 'won') {
            nextBet = lastBet.amount * progressiveBetting.winProgression;
        } else if (lastBet.status === 'lost') {
            nextBet = lastBet.amount * progressiveBetting.lossProgression;
        } else {
            // For push, surrender or other states, keep the same bet
            nextBet = lastBet.amount;
        }

        // If custom betting strategy is defined, use that instead
        if (bettingStrategy) {
            const previousBets = bets.filter(b => b.status !== 'pending')
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Use strategy to calculate next bet
            nextBet = bettingStrategy.getNextBet(previousBets, 1000, tableLimits);
        }

        // Ensure bet is within table limits
        nextBet = Math.max(tableLimits.minimumBet, Math.min(nextBet, tableLimits.maximumBet));

        // Round to nearest whole number
        return Math.round(nextBet);
    },

    // Side-bet actions - simplified implementations
    evaluateSideBets: (dealerHand, playerHands) => {
        // Simplified implementation - would need the actual logic from sideBetHelpers
        return [];
    },

    clearSideBets: () => {
        set(state => {
            const history = state.activeSideBets.filter(b => b.status !== 'pending');
            return {
                sideBetHistory: [...state.sideBetHistory, ...history],
                activeSideBets: []
            };
        });
    },

    getRecommendedSideBets: (playerHand, dealerUpCard) => {
        // Simplified implementation - would need the actual logic from sideBetHelpers
        return [];
    },

    resetStatistics: () => {
        set({
            sideBetStatistics: {
                totalSideBetsPlaced: 0,
                totalSideBetAmount: 0,
                sideBetWins: 0,
                sideBetLosses: 0,
                totalSideBetPayouts: 0,
                netProfit: 0,
                winRate: 0,
                typeStats: {}
            }
        });
    }
}));