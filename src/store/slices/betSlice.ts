/**
 * Bet slice for the blackjack game store
 */
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BetSlice } from '../../types/storeTypes';
import { Bet, BettingStrategy, ProgressiveBetting, TableLimits } from '../../types/betTypes';

// Default table limits
const DEFAULT_TABLE_LIMITS: TableLimits = {
    minimumBet: 5,
    maximumBet: 500,
    minimumSideBet: 1,
    maximumSideBet: 100
};

// Default progressive betting configuration
const DEFAULT_PROGRESSIVE_BETTING: ProgressiveBetting = {
    enabled: false,
    baseBet: 5,
    winProgression: 1,    // No change after win
    lossProgression: 2,   // Double after loss (Martingale)
    maxProgressionSteps: 5,
    resetCondition: 'win'
};

/**
 * Creates the bet slice
 */
const createBetSlice: StateCreator<BetSlice> = (set, get) => ({
    bets: [],
    currentBet: 0,
    minBet: DEFAULT_TABLE_LIMITS.minimumBet,
    maxBet: DEFAULT_TABLE_LIMITS.maximumBet,
    tableLimits: DEFAULT_TABLE_LIMITS,
    bettingStrategy: null,
    progressiveBetting: DEFAULT_PROGRESSIVE_BETTING,

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

    placeSideBet: (playerId, handId, type, amount) => {
        const { tableLimits } = get();

        // Validate side bet amount
        if (amount < (tableLimits.minimumSideBet || 1)) {
            throw new Error(`Side bet must be at least ${tableLimits.minimumSideBet || 1}`);
        }

        if (amount > (tableLimits.maximumSideBet || tableLimits.maximumBet)) {
            throw new Error(`Side bet cannot exceed ${tableLimits.maximumSideBet || tableLimits.maximumBet}`);
        }

        // Create a new side bet
        const sideBet: Bet = {
            id: uuidv4(),
            amount,
            status: 'pending',
            handId,
            timestamp: new Date()
        };

        // Add side bet to the store
        set(state => ({
            bets: [...state.bets, sideBet]
        }));

        return sideBet;
    },

    updateBet: (betId, amount) => {
        set(state => {
            const betIndex = state.bets.findIndex(b => b.id === betId);

            if (betIndex === -1) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            const bet = state.bets[betIndex];

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
        return set(state => {
            const betIndex = state.bets.findIndex(b => b.id === betId);

            if (betIndex === -1) {
                throw new Error(`Bet with ID ${betId} not found`);
            }

            const bet = state.bets[betIndex];

            // Calculate payout based on result
            let payout = 0;
            let payoutMultiplier = 0;
            let status: 'won' | 'lost' | 'push' | 'cancelled' | 'surrendered' = 'lost';

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

            // Return payout amount
            return payout;
        });
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

        let nextBet = progressiveBetting.baseBet;

        // Apply progression based on last result
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
            // This is simplified - a real strategy might have more complex logic
            nextBet = bettingStrategy.getNextBet(previousBets, 1000, tableLimits);
        }

        // Ensure bet is within table limits
        nextBet = Math.max(tableLimits.minimumBet, Math.min(nextBet, tableLimits.maximumBet));

        // Round to nearest whole number
        nextBet = Math.round(nextBet);

        return nextBet;
    }
});

export default createBetSlice;