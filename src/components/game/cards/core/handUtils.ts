/**
 * Core utility functions for hand operations
 * These are pure functions that handle hand calculations and evaluations
 */
import { Card } from '../../domains/card/cardTypes';
import { Hand, HandAction, DealerHand } from '../../types/handTypes';
import { GameOptions } from '../../types/gameTypes';

/**
 * Memoization utility for caching function results
 */
function memoize<Args extends unknown[], Result>(fn: (...args: Args) => Result): (...args: Args) => Result {
    const cache = new Map<string, Result>();

    return (...args: Args): Result => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = fn(...args);
        cache.set(key, result);

        return result;
    };
}

/**
 * Calculate all possible values for a hand (accounting for Aces)
 */
export const calculateValues = memoize((cards: Card[]): number[] => {
    // Initial value is 0
    let values = [0];

    cards.forEach(card => {
        // For regular number cards
        if (typeof card.value === 'number') {
            values = values.map(v => v + (card.value as number));
        }
        // For Aces (which can be 1 or 11)
        else if (Array.isArray(card.value)) {
            const [lowValue, highValue] = card.value;

            // For each existing value, create two new possibilities
            const newValues: number[] = [];

            values.forEach(value => {
                if (lowValue !== undefined) {
                    newValues.push(value + lowValue);  // Add low value
                }
                if (highValue !== undefined) {
                    newValues.push(value + highValue); // Add high value
                }
            });

            // Remove duplicates and update values
            values = Array.from(new Set(newValues));
        }
    });

    // Sort values ascending
    return values.sort((a, b) => a - b);
});

/**
 * Determine the best value for a hand
 * The best value is the highest value that doesn't exceed 21
 */
export const determineBestValue = memoize((values: number[]): number => {
    // Filter values that don't exceed 21
    const validValues = values.filter(v => v <= 21);

    // Return the highest valid value, or the lowest value if all are busts
    return validValues.length > 0
        ? Math.max(...validValues)
        : Math.min(...values);
});

/**
 * Check if a hand is a blackjack (21 with exactly 2 cards)
 */
export const isBlackjack = (hand: Hand): boolean => {
    return hand.cards.length === 2 && hand.bestValue === 21;
};

/**
 * Check if a hand is busted (value exceeds 21)
 */
export const isBusted = (hand: Hand): boolean => {
    return hand.bestValue > 21;
};

/**
 * Check if a hand is soft (contains an Ace counted as 11)
 */
export const isSoft = memoize((hand: Hand): boolean => {
    // Calculate value treating all Aces as 1
    const hardValue = hand.cards.reduce((sum, card) => {
        if (Array.isArray(card.value)) {
            const lowValue = card.value[0];
            return sum + (lowValue !== undefined ? lowValue : 0); // Add low value for Aces
        }
        return sum + (typeof card.value === 'number' ? card.value : 0);
    }, 0);

    // If best value is higher than hard value, hand must be soft
    return hand.bestValue > hardValue;
});

/**
 * Check if a hand has a pair (first two cards have same rank)
 */
export const isPair = (hand: Hand): boolean => {
    return hand.cards.length === 2 &&
        hand.cards[0]?.rank === hand.cards[1]?.rank;
};

/**
 * Evaluate a hand and return comprehensive assessment
 */
export const evaluateHand = memoize((cards: Card[]) => {
    const values = calculateValues(cards);
    const bestValue = determineBestValue(values);

    // Create a minimal hand object for evaluation
    const handForEval: Hand = {
        id: '',
        cards,
        values,
        bestValue,
        status: 'active',
        bet: 0,
        isSplit: false,
        isDoubled: false
    };

    return {
        values,
        bestValue,
        isSoft: isSoft(handForEval),
        isBlackjack: cards.length === 2 && bestValue === 21,
        isBusted: bestValue > 21
    };
});

/**
 * Check if doubling is allowed for a hand
 */
export const canDouble = (hand: Hand, allowedActions: HandAction[], gameOptions?: GameOptions): boolean => {
    // Use sensible defaults if gameOptions isn't provided
    const options = gameOptions ?? { doubleAfterSplit: true };

    return allowedActions.includes('double') &&
        hand.cards.length === 2 &&
        !hand.isDoubled &&
        (hand.isSplit ? options.doubleAfterSplit : true);
};

/**
 * Check if splitting is allowed for a hand
 */
export const canSplit = (hand: Hand, allowedActions: HandAction[], gameOptions?: GameOptions): boolean => {
    // Use sensible defaults if gameOptions isn't provided
    const options = gameOptions ?? { resplitAces: false };

    if (!allowedActions.includes('split') ||
        hand.cards.length !== 2 ||
        hand.cards[0]?.rank !== hand.cards[1]?.rank) {
        return false;
    }

    // Cannot split Aces again unless resplitAces is allowed
    const isResplittingAces = hand.cards[0]?.rank === 'A' && hand.isSplit && !options.resplitAces;

    return !isResplittingAces;
};

/**
 * Check if surrender is allowed for a hand
 */
export const canSurrender = (hand: Hand, allowedActions: HandAction[], gameOptions?: GameOptions): boolean => {
    // Use sensible defaults if gameOptions isn't provided
    const options = gameOptions ?? { lateSurrender: false };

    return allowedActions.includes('surrender') &&
        hand.cards.length === 2 &&
        options.lateSurrender;
};

/**
 * Check if insurance is allowed for a hand
 */
export const canInsure = (hand: Hand, dealerUpCard?: Card, allowedActions: HandAction[]): boolean => {
    return allowedActions.includes('insurance') &&
        dealerUpCard !== undefined &&
        dealerUpCard.rank === 'A' &&
        hand.cards.length === 2;
};

/**
 * Get available actions for a hand based on its current state and game rules
 */
export const getAvailableActions = (
    hand: Hand,
    dealerUpCard?: Card,
    options?: GameOptions
): HandAction[] => {
    if (hand.status !== 'active') {
        return [];
    }

    const gameOptions = options ?? {
        doubleAfterSplit: true,
        lateSurrender: false,
        resplitAces: false
    };

    // Default available actions
    const availableActions: HandAction[] = ['hit', 'stand'];

    // Check for specialized actions
    if (canDouble(hand, availableActions, gameOptions)) {
        availableActions.push('double');
    }

    if (canSplit(hand, availableActions, gameOptions)) {
        availableActions.push('split');
    }

    if (canSurrender(hand, availableActions, gameOptions)) {
        availableActions.push('surrender');
    }

    if (canInsure(hand, dealerUpCard, availableActions)) {
        availableActions.push('insurance');
    }

    return availableActions;
};

/**
 * Calculate the probability of busting with one more card
 */
export const calculateBustProbability = (hand: Hand, remainingCards: Card[]): number => {
    if (hand.bestValue >= 21) {
        return hand.bestValue > 21 ? 1 : 0; // Already busted or at 21
    }

    // Find the "safe" threshold - any card that would put hand over 21
    const safeThreshold = 21 - hand.bestValue;

    // Count cards that would cause a bust
    const bustingCards = remainingCards.filter(card => {
        const cardValue = typeof card.value === 'number'
            ? card.value
            : Math.min(...(card.value as number[]));
        return cardValue > safeThreshold;
    });

    return bustingCards.length / remainingCards.length;
};

/**
 * Compare a player hand with a dealer hand and determine the result
 */
export const compareHands = (
    playerHand: Hand,
    dealerHand: DealerHand
): 'win' | 'blackjack' | 'loss' | 'push' => {
    // Check for blackjack
    const playerHasBlackjack = isBlackjack(playerHand);
    const dealerHasBlackjack = dealerHand.cards.length === 2 && dealerHand.bestValue === 21;

    // Both have blackjack = push
    if (playerHasBlackjack && dealerHasBlackjack) {
        return 'push';
    }

    // Player has blackjack, dealer doesn't = blackjack win
    if (playerHasBlackjack) {
        return 'blackjack';
    }

    // Dealer has blackjack, player doesn't = loss
    if (dealerHasBlackjack) {
        return 'loss';
    }

    // Check for busts
    if (isBusted(playerHand)) {
        return 'loss';
    }

    if (dealerHand.bestValue > 21) {
        return 'win';
    }

    // Compare values
    if (playerHand.bestValue > dealerHand.bestValue) {
        return 'win';
    } else if (playerHand.bestValue < dealerHand.bestValue) {
        return 'loss';
    } else {
        return 'push';
    }
};

/**
 * Calculate the payout for a bet based on the result
 */
export const calculatePayout = (
    betAmount: number,
    result: 'win' | 'blackjack' | 'loss' | 'push' | 'surrender' | 'insurance',
    blackjackPayout: number = 1.5
): number => {
    switch (result) {
        case 'blackjack':
            return betAmount * (1 + blackjackPayout);
        case 'win':
            return betAmount * 2; // Original bet + 1:1 win
        case 'push':
            return betAmount; // Return original bet
        case 'loss':
            return 0; // Lose bet
        case 'surrender':
            return betAmount / 2; // Return half the bet
        case 'insurance':
            return betAmount * 3; // Original bet + 2:1 insurance payout
        default:
            return 0;
    }
};