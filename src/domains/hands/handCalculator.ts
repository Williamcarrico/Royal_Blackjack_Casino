/**
 * Hand calculator for evaluating blackjack hands
 */
import { Card } from '../../types/cardTypes';
import { Hand, HandAction } from '../../types/handTypes';
import { GameOptions } from '../../types/gameTypes';

/**
 * Calculate all possible values for a hand (accounting for Aces)
 */
export const calculateValues = (cards: Card[]): number[] => {
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
};

/**
 * Determine the best value for a hand
 * The best value is the highest value that doesn't exceed 21
 */
export const determineBestValue = (values: number[]): number => {
    // Filter values that don't exceed 21
    const validValues = values.filter(v => v <= 21);

    // Return the highest valid value, or the lowest value if all are busts
    return validValues.length > 0
        ? Math.max(...validValues)
        : Math.min(...values);
};

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
export const isSoft = (hand: Hand): boolean => {
    // Calculate value treating all Aces as 1
    const hardValue = hand.cards.reduce((sum, card) => {
        if (Array.isArray(card.value)) {
            const lowValue = card.value[0];
            return sum + (lowValue !== undefined ? lowValue : 0); // Add low value for Aces
        }
        return sum + card.value;
    }, 0);

    // If best value is higher than hard value, hand must be soft
    return hand.bestValue > hardValue;
};

/**
 * Check if a hand has a pair (first two cards have same rank)
 */
export const isPair = (hand: Hand): boolean => {
    return hand.cards.length === 2 &&
        hand.cards[0]?.rank === hand.cards[1]?.rank;
};

/**
 * Check if doubling is allowed for a hand
 */
const canDouble = (hand: Hand, allowedActions: HandAction[], gameOptions: GameOptions): boolean => {
    return allowedActions.includes('double') &&
        hand.cards.length === 2 &&
        !hand.isDoubled &&
        (hand.isSplit ? gameOptions.doubleAfterSplit : true);
};

/**
 * Check if splitting is allowed for a hand
 */
const canSplit = (hand: Hand, allowedActions: HandAction[], gameOptions: GameOptions): boolean => {
    if (!allowedActions.includes('split') ||
        hand.cards.length !== 2 ||
        hand.cards[0]?.rank !== hand.cards[1]?.rank) {
        return false;
    }

    // Cannot split if already at max split hands
    const isSplitHandLimitReached = false; // This would need to be determined from game state

    // Cannot split Aces again unless resplitAces is allowed
    const isResplittingAces = hand.cards[0]?.rank === 'A' && hand.isSplit && !gameOptions.resplitAces;

    return !isSplitHandLimitReached && !isResplittingAces;
};

/**
 * Check if surrender is allowed for a hand
 */
const canSurrender = (hand: Hand, allowedActions: HandAction[], gameOptions: GameOptions): boolean => {
    return allowedActions.includes('surrender') &&
        hand.cards.length === 2 &&
        gameOptions.lateSurrender;
};

/**
 * Check if insurance is allowed for a hand
 */
const canInsure = (hand: Hand, dealerUpCard: Card | undefined, allowedActions: HandAction[]): boolean => {
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
    const actions: HandAction[] = [];

    // If hand is not active, no actions are available
    if (hand.status !== 'active') {
        return actions;
    }

    // Default options if not provided
    const gameOptions = options || {
        variant: 'standard',
        numberOfDecks: 6,
        dealerHitsSoft17: true,
        blackjackPays: 1.5,
        doubleAfterSplit: true,
        resplitAces: false,
        lateSurrender: true,
        maxSplitHands: 4,
        allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
        insurance: true,
        evenMoney: true,
        surrender: true,
        // Add missing required properties
        penetration: 0.75,
        tableLimits: { min: 5, max: 500 },
        payoutRules: { blackjack: 1.5 },
        availableSideBets: [],
        deckRotationStrategy: 'penetration'
    } as unknown as GameOptions;

    // Get allowed actions from options
    const { allowedActions } = gameOptions;

    // Hit and stand are always available for active hands
    if (allowedActions.includes('hit')) actions.push('hit');
    if (allowedActions.includes('stand')) actions.push('stand');

    // Double is available on first two cards
    if (canDouble(hand, allowedActions, gameOptions)) {
        actions.push('double');
    }

    // Split is available for pairs
    if (canSplit(hand, allowedActions, gameOptions)) {
        actions.push('split');
    }

    // Surrender is available on first two cards if allowed
    if (canSurrender(hand, allowedActions, gameOptions)) {
        actions.push('surrender');
    }

    // Insurance is available when dealer shows an Ace
    if (canInsure(hand, dealerUpCard, allowedActions)) {
        actions.push('insurance');
    }

    return actions;
};

/**
 * Evaluate probability of busting with one more card
 */
export const calculateBustProbability = (hand: Hand, remainingCards: Card[]): number => {
    // If already busted, probability is 100%
    if (isBusted(hand)) {
        return 1;
    }

    // Calculate how much more we can add before busting
    const safeValueRemaining = 21 - hand.bestValue;

    // Count cards that would cause a bust
    const bustCards = remainingCards.filter(card => {
        // For numbered cards, just check the value
        if (typeof card.value === 'number') {
            return card.value > safeValueRemaining;
        }
        // For Aces, check if even the low value would bust
        else if (Array.isArray(card.value)) {
            const lowValue = card.value[0];
            return lowValue !== undefined && lowValue > safeValueRemaining;
        }
        return false;
    });

    // Return probability as a number between 0 and 1
    return bustCards.length / remainingCards.length;
};

/**
 * Get strategy for pair hands
 */
const getPairStrategy = (
    pairRank: string,
    dealerValue: number,
    availableActions: HandAction[]
): HandAction | null => {
    if (!availableActions.includes('split')) return null;

    // Helper function to check dealer value range
    const isWithinDealerRange = (min: number, max: number): boolean =>
        dealerValue >= min && dealerValue <= max;

    // Always split Aces and 8s
    if (pairRank === 'A' || pairRank === '8') {
        return 'split';
    }

    // Never split 10s, 5s, 4s
    if (pairRank === '10' || pairRank === 'J' || pairRank === 'Q' || pairRank === 'K' ||
        pairRank === '5' || pairRank === '4') {
        return null; // Continue to next strategy
    }

    // Split 9s against dealer 2-9 except 7
    if (pairRank === '9' && isWithinDealerRange(2, 9) && dealerValue !== 7) {
        return 'split';
    }

    // Split 7s, 3s, and 2s against dealer 2-7
    if ((pairRank === '7' || pairRank === '3' || pairRank === '2') && isWithinDealerRange(2, 7)) {
        return 'split';
    }

    // Split 6s against dealer 2-6
    if (pairRank === '6' && isWithinDealerRange(2, 6)) {
        return 'split';
    }

    return null;
};

/**
 * Get strategy for soft hands
 */
const getSoftHandStrategy = (
    handValue: number,
    dealerValue: number,
    availableActions: HandAction[]
): HandAction => {
    // Soft 19 or higher
    if (handValue >= 19) {
        return 'stand';
    }

    // Soft 18
    if (handValue === 18) {
        if (availableActions.includes('double') && dealerValue >= 3 && dealerValue <= 6) {
            return 'double';
        }
        return (dealerValue >= 9 || dealerValue === 1) ? 'hit' : 'stand';
    }

    // Soft 17
    if (handValue === 17) {
        if (availableActions.includes('double') && dealerValue >= 3 && dealerValue <= 6) {
            return 'double';
        }
        return 'hit';
    }

    // Soft 15-16
    if (handValue >= 15) {
        if (availableActions.includes('double') && dealerValue >= 4 && dealerValue <= 6) {
            return 'double';
        }
        return 'hit';
    }

    // Soft 13-14
    if (handValue >= 13) {
        if (availableActions.includes('double') && dealerValue >= 5 && dealerValue <= 6) {
            return 'double';
        }
        return 'hit';
    }

    // Soft 12 or lower
    return 'hit';
};

/**
 * Get strategy for hard hands
 */
const getHardHandStrategy = (
    handValue: number,
    dealerValue: number,
    availableActions: HandAction[]
): HandAction => {
    // Hard 17 or higher
    if (handValue >= 17) {
        return 'stand';
    }

    // Hard 13-16
    if (handValue >= 13) {
        return (dealerValue >= 2 && dealerValue <= 6) ? 'stand' : 'hit';
    }

    // Hard 12
    if (handValue === 12) {
        return (dealerValue >= 4 && dealerValue <= 6) ? 'stand' : 'hit';
    }

    // Hard 11
    if (handValue === 11) {
        return availableActions.includes('double') ? 'double' : 'hit';
    }

    // Hard 10
    if (handValue === 10) {
        if (availableActions.includes('double') && dealerValue >= 2 && dealerValue <= 9) {
            return 'double';
        }
        return 'hit';
    }

    // Hard 9
    if (handValue === 9) {
        if (availableActions.includes('double') && dealerValue >= 3 && dealerValue <= 6) {
            return 'double';
        }
        return 'hit';
    }

    // Hard 8 or lower
    return 'hit';
};

/**
 * Calculate best action based on basic strategy
 * This is a simplified version of basic strategy
 */
export const getBasicStrategyAction = (
    hand: Hand,
    dealerUpCard: Card,
    options?: GameOptions
): HandAction => {
    // Get available actions for this hand
    const availableActions = getAvailableActions(hand, dealerUpCard, options);

    // If only one action is available, return that
    if (availableActions.length === 1) {
        return availableActions[0] || 'stand'; // Fallback to stand if undefined
    }

    // Early exit if no actions available
    if (availableActions.length === 0) {
        return 'stand'; // Default fallback
    }

    // Get dealer and hand values
    const handValue = hand.bestValue;
    const dealerValue = getDealerValue(dealerUpCard);

    // Apply appropriate strategy based on hand type
    return determineStrategy(hand, handValue, dealerValue, availableActions);
};

/**
 * Extract dealer card value for strategy decisions
 */
function getDealerValue(dealerUpCard: Card): number {
    if (typeof dealerUpCard.value === 'number') {
        return dealerUpCard.value;
    }

    // Handle Ace value
    if (Array.isArray(dealerUpCard.value) && dealerUpCard.value[1] !== undefined) {
        return dealerUpCard.value[1];
    }

    // Default: Ace=11, Face cards=10
    return dealerUpCard.rank === 'A' ? 11 : 10;
}

/**
 * Determine strategy based on hand type
 */
function determineStrategy(
    hand: Hand,
    handValue: number,
    dealerValue: number,
    availableActions: HandAction[]
): HandAction {
    // Check for pairs first
    if (isPair(hand)) {
        const pairRank = hand.cards[0]?.rank;
        if (!pairRank) return 'hit'; // Fallback if no rank

        const pairAction = getPairStrategy(pairRank, dealerValue, availableActions);
        if (pairAction) return pairAction;
    }

    // Check for soft hands (hands with an Ace counted as 11)
    if (isSoft(hand)) {
        return getSoftHandStrategy(handValue, dealerValue, availableActions);
    }

    // Hard hands
    return getHardHandStrategy(handValue, dealerValue, availableActions);
}

/**
 * Adjust distribution for soft 17 rule
 */
function adjustForSoft17(distribution: Record<number, number>): void {
    // Ensure properties exist before modifying them
    if (distribution[17] !== undefined) distribution[17] -= 0.05;
    if (distribution[18] !== undefined) distribution[18] += 0.01;
    if (distribution[19] !== undefined) distribution[19] += 0.01;
    if (distribution[20] !== undefined) distribution[20] += 0.01;
    if (distribution[21] !== undefined) distribution[21] += 0.01;
    if (distribution[22] !== undefined) distribution[22] += 0.01; // Bust probability increases
}

/**
 * Calculate dealer's final hand probability distribution
 * This is a simplified model assuming infinite deck
 */
export const calculateDealerFinalHandDistribution = (
    dealerUpCard: Card,
    hitSoft17: boolean
): Record<number, number> => {
    // Get initial dealer card value
    const initialValue = getDealerValue(dealerUpCard);

    // Distribution tables for dealer probabilities by card
    const distributionByCard: Record<number, Record<number, number>> = {
        2: { 17: 0.145, 18: 0.144, 19: 0.145, 20: 0.146, 21: 0.077, 22: 0.343 },
        3: { 17: 0.142, 18: 0.143, 19: 0.143, 20: 0.143, 21: 0.092, 22: 0.337 },
        4: { 17: 0.139, 18: 0.139, 19: 0.140, 20: 0.139, 21: 0.112, 22: 0.331 },
        5: { 17: 0.140, 18: 0.139, 19: 0.140, 20: 0.140, 21: 0.113, 22: 0.328 },
        6: { 17: 0.143, 18: 0.142, 19: 0.142, 20: 0.142, 21: 0.113, 22: 0.318 },
        7: { 17: 0.172, 18: 0.143, 19: 0.142, 20: 0.142, 21: 0.142, 22: 0.259 },
        8: { 17: 0.142, 18: 0.173, 19: 0.143, 20: 0.142, 21: 0.142, 22: 0.258 },
        9: { 17: 0.141, 18: 0.142, 19: 0.173, 20: 0.143, 21: 0.142, 22: 0.259 },
        10: { 17: 0.120, 18: 0.121, 19: 0.122, 20: 0.354, 21: 0.123, 22: 0.160 },
        11: { 17: 0.129, 18: 0.130, 19: 0.130, 20: 0.131, 21: 0.347, 22: 0.133 }, // Ace
        0: { 17: 0.166, 18: 0.166, 19: 0.166, 20: 0.166, 21: 0.166, 22: 0.170 } // Default
    };

    // Get the distribution from the table (or use default if not found)
    const distributionTable = distributionByCard[initialValue] || distributionByCard[0];

    // Ensure distributionTable is defined
    if (!distributionTable) {
        return { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0 };
    }

    const distribution: Record<number, number> = {
        17: distributionTable[17] ?? 0,
        18: distributionTable[18] ?? 0,
        19: distributionTable[19] ?? 0,
        20: distributionTable[20] ?? 0,
        21: distributionTable[21] ?? 0,
        22: distributionTable[22] ?? 0
    };

    // Adjust for stand/hit on soft 17 rule
    if (hitSoft17 && initialValue === 6) {
        adjustForSoft17(distribution);
    }

    return distribution;
};

/**
 * Categorizes dealer hand outcome relative to player hand
 */
function categorizeDealerHand(dealerValue: number, handValue: number): 'win' | 'lose' | 'push' {
    if (dealerValue > 21) return 'win';       // Dealer busts
    if (dealerValue > handValue) return 'lose'; // Dealer wins
    if (dealerValue < handValue) return 'win';  // Player wins
    return 'push';                              // Equal values
}

/**
 * Calculate standard hand outcome probabilities
 */
function calculateStandardOutcome(
    handValue: number,
    dealerDistribution: Record<number, number>
): { win: number; lose: number; push: number } {
    const result = { win: 0, lose: 0, push: 0 };

    Object.entries(dealerDistribution).forEach(([dealerValueStr, probability]) => {
        const dealerValue = parseInt(dealerValueStr, 10);
        const outcome = categorizeDealerHand(dealerValue, handValue);
        result[outcome] += probability;
    });

    return result;
}

/**
 * Calculate outcome probabilities for a blackjack hand
 */
function calculateBlackjackOutcome(dealerUpCard: Card): { win: number; lose: number; push: number } {
    // For a blackjack, the player wins unless dealer also has a blackjack
    const dealerValue = getDealerValue(dealerUpCard);

    // Probability of dealer getting blackjack based on upcard
    let dealerBlackjackProbability = 0;

    if (dealerValue === 11) { // Ace showing
        dealerBlackjackProbability = 0.31; // ~31% chance of dealer having blackjack with Ace up
    } else if (dealerValue === 10) { // 10, J, Q, K showing
        dealerBlackjackProbability = 0.12; // ~12% chance of dealer having blackjack with 10-value card up
    }

    return {
        win: 1 - dealerBlackjackProbability, // Win if dealer doesn't have blackjack
        lose: 0, // Player with blackjack never loses (at worst pushes)
        push: dealerBlackjackProbability // Push if dealer also has blackjack
    };
}

/**
 * Calculate win/lose/push probability against dealer
 */
export const calculateHandOutcomeProbabilities = (
    hand: Hand,
    dealerUpCard: Card,
    hitSoft17: boolean
): { win: number; lose: number; push: number } => {
    // If hand is busted, 100% lose
    if (isBusted(hand)) {
        return { win: 0, lose: 1, push: 0 };
    }

    // Special case: Blackjack
    if (isBlackjack(hand)) {
        return calculateBlackjackOutcome(dealerUpCard);
    }

    // Get dealer final hand distribution
    const dealerDistribution = calculateDealerFinalHandDistribution(dealerUpCard, hitSoft17);

    // Calculate standard outcome probabilities
    return calculateStandardOutcome(hand.bestValue, dealerDistribution);
};

/**
 * Hand Calculator object with all hand evaluation methods
 */
const HandCalculator = {
    calculateValues,
    determineBestValue,
    isBlackjack,
    isBusted,
    isSoft,
    isPair,
    getAvailableActions,
    calculateBustProbability,
    getBasicStrategyAction,
    calculateDealerFinalHandDistribution,
    calculateHandOutcomeProbabilities
};

export default HandCalculator;