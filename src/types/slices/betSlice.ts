'use client';

/**
 * Bet slice for the blackjack game store
 */
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BetSlice } from '../../types/storeTypes';
import { Bet, ProgressiveBetting, TableLimits } from '../../types/betTypes';
import {
    DEFAULT_TABLE_LIMITS,
    DEFAULT_PROGRESSIVE_BETTING,
    AVAILABLE_SIDE_BETS
} from '../../lib/constants/betConfig';
import {
    updateSideBetFromResult,
    updateStatisticsForResult,
    calculateUpdatedStatistics,
    evaluateSideBetResult,
    isValidHandForRecommendation,
    checkPerfectPairsRecommendation,
    check21Plus3Recommendation,
    checkInsuranceRecommendation,
    checkLuckyLuckyRecommendation
} from '../../lib/utils/sideBetHelpers';
import type { ValidationError } from '../../types/utilTypes';

const createBetSlice: StateCreator<BetSlice> = (set, get) => ({
    // Core bet state
    bets: [],
    currentBet: 0,
    minBet: DEFAULT_TABLE_LIMITS.minimumBet,
    maxBet: DEFAULT_TABLE_LIMITS.maximumBet,
    tableLimits: DEFAULT_TABLE_LIMITS,
    bettingStrategy: null,
    progressiveBetting: DEFAULT_PROGRESSIVE_BETTING,

    // Validation functions
    canPlace: (amount: number) => {
        const { tableLimits } = get();
        const { minimumBet, maximumBet } = tableLimits;
        if (amount < minimumBet || amount > maximumBet) {
            return false;
        }
        const state = get() as any;
        const players = state.players;
        const activeIndex = state.activePlayerIndex;
        const balance = players[activeIndex]?.balance ?? 0;
        return balance >= amount;
    },
    validate: (amount: number): ValidationError | null => {
        const { tableLimits } = get();
        const { minimumBet, maximumBet } = tableLimits;
        if (amount < minimumBet) {
            return { field: 'amount', message: `Bet must be at least ${minimumBet}`, code: 'MIN_BET' };
        }
        if (amount > maximumBet) {
            return { field: 'amount', message: `Bet cannot exceed ${maximumBet}`, code: 'MAX_BET' };
        }
        const state = get() as any;
        const players = state.players;
        const activeIndex = state.activePlayerIndex;
        const balance = players[activeIndex]?.balance ?? 0;
        if (balance < amount) {
            return { field: 'amount', message: `Insufficient balance`, code: 'INSUFFICIENT_BALANCE' };
        }
        return null;
    },

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

    placeBet: (playerId, amount) => {
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

    placeSideBet: (type, handId, playerId, amount) => {
        const available = get().availableSideBets.find(b => b.name === type);
        if (!available) throw new Error(`Side bet type '${type}' is not available`);
        if (amount < available.minBet || amount > available.maxBet) {
            throw new Error(`Side bet amount must be between ${available.minBet} and ${available.maxBet}`);
        }
        const betId = uuidv4();
        set(state => {
            // update history and stats
            const stats = { ...state.sideBetStatistics };
            stats.totalSideBetsPlaced++;
            stats.totalSideBetAmount += amount;
            stats.typeStats[type] = stats.typeStats[type] || { betsPlaced: 0, totalAmount: 0, wins: 0, losses: 0, totalPayouts: 0, roi: 0 };
            stats.typeStats[type].betsPlaced++;
            stats.typeStats[type].totalAmount += amount;
            return {
                activeSideBets: [...state.activeSideBets, { id: betId, type, handId, playerId, amount, status: 'pending', payout: 0, payoutMultiplier: 0, timestamp: new Date() }],
                sideBetStatistics: stats
            };
        });
        return { id: betId, type, handId, playerId, amount, status: 'pending', payout: 0, payoutMultiplier: 0, timestamp: new Date() };
    },

    evaluateSideBets: (dealerHand, playerHands) => {
        const results = [];
        get().activeSideBets.forEach(bet => {
            const playerHand = playerHands.find(h => h.id === bet.handId);
            if (!playerHand || playerHand.cards.length < 2 || !dealerHand.cards.length) return;
            const result = evaluateSideBetResult(bet.type, playerHand, dealerHand.cards[0], bet.amount, get().availableSideBets);
            results.push(result);
        });
        set(state => {
            const updatedBets = state.activeSideBets.map(bet => updateSideBetFromResult(bet, results.find(r => r.handId === bet.handId && r.type === bet.type)));
            const stats = calculateUpdatedStatistics(results.reduce((s, r) => { updateStatisticsForResult(s, r); return s; }, { ...state.sideBetStatistics }));
            return { activeSideBets: updatedBets, sideBetStatistics: stats };
        });
        return results;
    },

    clearSideBets: () => {
        set(state => {
            const history = state.activeSideBets.filter(b => b.status !== 'pending');
            return { sideBetHistory: [...state.sideBetHistory, ...history], activeSideBets: [] };
        });
    },

    getRecommendedSideBets: (playerHand, dealerUpCard) => {
        if (!isValidHandForRecommendation(playerHand, dealerUpCard)) return [];
        const recs = [];
        checkPerfectPairsRecommendation(playerHand.cards, recs);
        check21Plus3Recommendation(playerHand.cards, dealerUpCard, recs);
        checkInsuranceRecommendation(dealerUpCard, recs);
        checkLuckyLuckyRecommendation(playerHand.cards, dealerUpCard, recs);
        return recs;
    },

    resetStatistics: () => { // side-bet statistics reset
        set({ sideBetStatistics: { totalSideBetsPlaced: 0, totalSideBetAmount: 0, sideBetWins: 0, sideBetLosses: 0, totalSideBetPayouts: 0, netProfit: 0, winRate: 0, typeStats: {} } });
    },

    updateBet: (betId, amount) => {
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

    removeBet: (betId) => {
        set(state => {
            const betIndex = state.bets.findIndex(b => b.id === betId);

            if (betIndex === -1) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            const bet = state.bets[betIndex];
            if (!bet) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            // Ensure bet is pending (not already in play)
            if (bet.status !== 'pending') {
                throw new Error('Cannot remove bet that is already in play');
            }

            // Remove the bet
            const updatedBets = state.bets.filter(b => b.id !== betId);

            return {
                bets: updatedBets,
                currentBet: 0
            };
        });
    },

    clearBets: () => {
        set({
            bets: [],
            currentBet: 0
        });
    },

    settleBet: (betId, result) => {
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
            let status: 'won' | 'lost' | 'push' | 'cancelled' | 'surrendered';

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
                bets: updatedBets,
                payout
            };
        });

        // This will be the return value
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
    }
});

export default createBetSlice;