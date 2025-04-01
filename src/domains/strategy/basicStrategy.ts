/**
 * Basic strategy advisor for Blackjack
 * Implements standard basic strategy tables and provides action recommendations
 */
import { Card } from '../../types/cardTypes';
import { Hand, HandAction } from '../../types/handTypes';
import { GameOptions } from '../../types/gameTypes';
import { calculateValues, determineBestValue, isPair, isSoft } from '../hands/handCalculator';

// Types for strategy tables
type DealerUpCard = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';
type HandType = 'hard' | 'soft' | 'pair';
type StrategyTable = Record<string, Record<DealerUpCard, HandAction>>;

/**
 * Basic strategy table for hard hands (no ace counted as 11)
 * Rows: player's hand total (5-20)
 * Columns: dealer's up card (2-10, A)
 */
const HARD_HAND_STRATEGY: StrategyTable = {
    // 5-8
    '5': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },
    '6': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },
    '7': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },
    '8': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 9
    '9': { '2': 'hit', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 10
    '10': { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'hit', 'A': 'hit' },

    // 11
    '11': { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'double', 'A': 'hit' },

    // 12
    '12': { '2': 'hit', '3': 'hit', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 13-16
    '13': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },
    '14': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },
    '15': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },
    '16': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 17+
    '17': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' },
    '18': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' },
    '19': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' },
    '20': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' }
};

/**
 * Basic strategy table for soft hands (ace counted as 11)
 * Rows: player's hand total (13-20, which means A-2 through A-9)
 * Columns: dealer's up card (2-10, A)
 */
const SOFT_HAND_STRATEGY: StrategyTable = {
    // A-2 (13)
    '13': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // A-3 (14)
    '14': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // A-4 (15)
    '15': { '2': 'hit', '3': 'hit', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // A-5 (16)
    '16': { '2': 'hit', '3': 'hit', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // A-6 (17)
    '17': { '2': 'hit', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // A-7 (18)
    '18': { '2': 'stand', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'stand', '8': 'stand', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // A-8 (19)
    '19': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' },

    // A-9 (20)
    '20': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' }
};

/**
 * Basic strategy table for pairs
 * Rows: player's pair (2-2 through A-A)
 * Columns: dealer's up card (2-10, A)
 */
const PAIR_STRATEGY: StrategyTable = {
    // 2-2
    '2': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 3-3
    '3': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 4-4
    '4': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 5-5
    '5': { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'hit', 'A': 'hit' },

    // 6-6
    '6': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 7-7
    '7': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', 'A': 'hit' },

    // 8-8
    '8': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', 'A': 'split' },

    // 9-9
    '9': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'stand', '8': 'split', '9': 'split', '10': 'stand', 'A': 'stand' },

    // 10-10 (T-T, J-J, Q-Q, K-K)
    '10': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'A': 'stand' },

    // A-A
    'A': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', 'A': 'split' }
};

/**
 * Basic strategy table for surrendering
 * Only includes entries where surrender is recommended
 * For all other situations, don't surrender
 */
const SURRENDER_STRATEGY: Record<string, Record<DealerUpCard, boolean>> = {
    '16': { '2': false, '3': false, '4': false, '5': false, '6': false, '7': false, '8': false, '9': true, '10': true, 'A': true },
    '15': { '2': false, '3': false, '4': false, '5': false, '6': false, '7': false, '8': false, '9': false, '10': true, 'A': false }
};

/**
 * Late surrender strategy (surrender allowed after dealer checks for blackjack)
 */
const LATE_SURRENDER_STRATEGY: Record<string, Record<DealerUpCard, boolean>> = {
    ...SURRENDER_STRATEGY,
    // Additional surrender options with late surrender
    '17': { '2': false, '3': false, '4': false, '5': false, '6': false, '7': false, '8': false, '9': false, '10': false, 'A': true }
};

/**
 * Insurance strategy - only take insurance with a 10-value hand
 */
const INSURANCE_STRATEGY: Record<string, boolean> = {
    '20': true,  // 10-10 hand
    '19': false,
    '18': false,
    '17': false,
    '16': false,
    '15': false,
    '14': false,
    '13': false,
    '12': false,
    '11': false,
    '10': false,
    '9': false,
    '8': false,
    '7': false,
    '6': false,
    '5': false,
    '4': false
};

/**
 * Determine if a hand is a candidate for surrender
 */
const shouldSurrender = (
    handTotal: number,
    dealerUpCard: DealerUpCard,
    options?: GameOptions
): boolean => {
    // Check if surrender is even allowed
    if (!options?.allowedActions.includes('surrender')) {
        return false;
    }

    // Determine if late surrender is available
    const surrenderTable = options.lateSurrender ? LATE_SURRENDER_STRATEGY : SURRENDER_STRATEGY;

    // Check surrender table
    return surrenderTable[handTotal.toString()]?.[dealerUpCard] ?? false;
};

/**
 * Determine if a player should take insurance
 */
const shouldTakeInsurance = (
    hand: Hand,
    options?: GameOptions
): boolean => {
    // Check if insurance is even allowed
    if (!options?.allowedActions.includes('insurance')) {
        return false;
    }

    // Recalculate hand values to ensure accuracy
    const values = calculateValues(hand.cards);
    const bestValue = determineBestValue(values);

    // Basic strategy says only take insurance with a 10-value hand (i.e., 20 total)
    return bestValue === 20 && (INSURANCE_STRATEGY[bestValue.toString()] ?? false);
};

/**
 * Normalize a card rank to a dealer upcard key
 */
const normalizeUpcard = (upCard: Card): DealerUpCard => {
    // Face cards (J, Q, K) count as 10
    if (['J', 'Q', 'K'].includes(upCard.rank)) {
        return '10';
    }
    return upCard.rank as DealerUpCard;
};

/**
 * Get the recommended action for a pair hand
 */
const getPairAction = (
    hand: Hand,
    dealerUpCard: DealerUpCard,
    options?: GameOptions
): HandAction => {
    // Make sure hand is actually a pair
    if (!isPair(hand) || hand.cards.length !== 2) {
        throw new Error('Hand is not a valid pair');
    }

    // Get the rank of the pair
    const pairRank = hand.cards[0]?.rank;

    if (!pairRank) {
        throw new Error('Invalid hand: missing cards');
    }

    // Normalize face cards to 10
    const normalizedRank = ['J', 'Q', 'K'].includes(pairRank) ? '10' : pairRank;

    // Get recommended action from pair strategy table
    const recommendedAction = PAIR_STRATEGY[normalizedRank]?.[dealerUpCard] || 'hit';

    // Check if split is allowed
    if (recommendedAction === 'split' && !options?.allowedActions?.includes('split')) {
        // Recalculate hand value for accuracy before falling back to hard strategy
        const values = calculateValues(hand.cards);
        const bestValue = determineBestValue(values);

        // If splitting isn't allowed, fall back to hard hand strategy
        return HARD_HAND_STRATEGY[bestValue.toString()]?.[dealerUpCard] || 'hit';
    }

    return recommendedAction;
};

/**
 * Get the recommended action for a soft hand
 */
const getSoftAction = (
    hand: Hand,
    dealerUpCard: DealerUpCard,
    options?: GameOptions
): HandAction => {
    // Make sure hand is actually soft
    if (!isSoft(hand)) {
        throw new Error('Hand is not a valid soft hand');
    }

    // Get recommended action from soft strategy table
    const recommendedAction = SOFT_HAND_STRATEGY[hand.bestValue.toString()]?.[dealerUpCard] || 'hit';

    // Check if doubling is allowed
    if (recommendedAction === 'double' && !options?.allowedActions?.includes('double')) {
        // If doubling isn't allowed, fall back to hit for soft hands
        return 'hit';
    }

    return recommendedAction;
};

/**
 * Get the recommended action for a hard hand
 */
const getHardAction = (
    hand: Hand,
    dealerUpCard: DealerUpCard,
    options?: GameOptions
): HandAction => {
    // Get recommended action from hard strategy table
    const recommendedAction = HARD_HAND_STRATEGY[hand.bestValue.toString()]?.[dealerUpCard] || 'hit';

    // Check if doubling is allowed
    if (recommendedAction === 'double' && !options?.allowedActions?.includes('double')) {
        // If doubling isn't allowed, fall back to hit
        return 'hit';
    }

    return recommendedAction;
};

/**
 * Get the hand type (pair, soft, or hard)
 */
const getHandType = (hand: Hand): HandType => {
    if (hand.cards.length === 2 && isPair(hand)) {
        return 'pair';
    } else if (isSoft(hand)) {
        return 'soft';
    } else {
        return 'hard';
    }
};

/**
 * Get the recommended basic strategy action for a hand
 */
export const getBasicStrategyAction = (
    hand: Hand,
    dealerUpCard: Card,
    options?: GameOptions
): HandAction => {
    // Normalize dealer upcard
    const normalizedUpcard = normalizeUpcard(dealerUpCard);

    // Recalculate hand values to ensure accuracy
    const values = calculateValues(hand.cards);
    const bestValue = determineBestValue(values);

    // Create a verified hand with recalculated values
    const verifiedHand: Hand = {
        ...hand,
        values,
        bestValue
    };

    // Check for surrender first
    if (shouldSurrender(verifiedHand.bestValue, normalizedUpcard, options)) {
        return 'surrender';
    }

    // Check for insurance if dealer shows an Ace
    if (dealerUpCard.rank === 'A' && shouldTakeInsurance(verifiedHand, options)) {
        return 'insurance';
    }

    // Get hand type
    const handType = getHandType(verifiedHand);

    // Get action based on hand type
    switch (handType) {
        case 'pair':
            return getPairAction(verifiedHand, normalizedUpcard, options);
        case 'soft':
            return getSoftAction(verifiedHand, normalizedUpcard, options);
        case 'hard':
        default:
            return getHardAction(verifiedHand, normalizedUpcard, options);
    }
};

/**
 * Get a detailed explanation for the recommended action
 */
export const getActionExplanation = (
    hand: Hand,
    dealerUpCard: Card,
    recommendedAction: HandAction
): string => {
    const handType = getHandType(hand);

    // Recalculate hand values for accuracy in explanation
    const values = calculateValues(hand.cards);
    const bestValue = determineBestValue(values);

    const explanations: Record<HandAction, Record<HandType, string>> = {
        'hit': {
            'hard': `With a hard ${bestValue}, basic strategy recommends hitting against dealer ${dealerUpCard.rank}.`,
            'soft': `With a soft ${bestValue}, basic strategy recommends hitting against dealer ${dealerUpCard.rank}.`,
            'pair': `With a pair of ${hand.cards[0]?.rank || 'unknown'}'s, basic strategy recommends hitting rather than splitting against dealer ${dealerUpCard.rank}.`
        },
        'stand': {
            'hard': `With a hard ${bestValue}, basic strategy recommends standing against dealer ${dealerUpCard.rank}.`,
            'soft': `With a soft ${bestValue}, basic strategy recommends standing against dealer ${dealerUpCard.rank}.`,
            'pair': `With a pair of ${hand.cards[0]?.rank || 'unknown'}'s, basic strategy recommends standing rather than splitting against dealer ${dealerUpCard.rank}.`
        },
        'double': {
            'hard': `With a hard ${bestValue}, basic strategy recommends doubling down against dealer ${dealerUpCard.rank}.`,
            'soft': `With a soft ${bestValue}, basic strategy recommends doubling down against dealer ${dealerUpCard.rank}.`,
            'pair': `With a pair of ${hand.cards[0]?.rank || 'unknown'}'s, basic strategy recommends doubling down rather than splitting against dealer ${dealerUpCard.rank}.`
        },
        'split': {
            'hard': `Cannot split a hard hand.`,
            'soft': `Cannot split a soft hand.`,
            'pair': `With a pair of ${hand.cards[0]?.rank || 'unknown'}'s, basic strategy recommends splitting against dealer ${dealerUpCard.rank}.`
        },
        'surrender': {
            'hard': `With a hard ${bestValue}, basic strategy recommends surrendering against dealer ${dealerUpCard.rank}.`,
            'soft': `With a soft ${bestValue}, basic strategy recommends surrendering against dealer ${dealerUpCard.rank}.`,
            'pair': `With a pair of ${hand.cards[0]?.rank || 'unknown'}'s, basic strategy recommends surrendering against dealer ${dealerUpCard.rank}.`
        },
        'insurance': {
            'hard': `With a hard ${bestValue}, basic strategy recommends taking insurance against dealer Ace.`,
            'soft': `With a soft ${bestValue}, basic strategy recommends taking insurance against dealer Ace.`,
            'pair': `With a pair of ${hand.cards[0]?.rank || 'unknown'}'s, basic strategy recommends taking insurance against dealer Ace.`
        }
    };

    return explanations[recommendedAction]?.[handType] ||
        `Basic strategy recommends ${recommendedAction} with this hand against dealer ${dealerUpCard.rank}.`;
};

/**
 * Calculate the expected value of a hand given the recommended action
 * This is a simplified estimation
 */
export const calculateExpectedValue = (
    hand: Hand,
    dealerUpCard: Card,
    action: HandAction
): number => {
    // Expected values (approximate) for various hand situations
    // These are simplified estimates and would be more accurate with exact composition-dependent calculations
    const dealerBustProbabilities: Record<string, number> = {
        '2': 0.35, '3': 0.37, '4': 0.40, '5': 0.42, '6': 0.44,
        '7': 0.26, '8': 0.24, '9': 0.23, '10': 0.21, 'J': 0.21,
        'Q': 0.21, 'K': 0.21, 'A': 0.17
    };

    // Base probability of dealer busting
    const dealerBustProb = dealerBustProbabilities[dealerUpCard.rank] || 0.25;

    // Recalculate hand values for accurate expected value
    const values = calculateValues(hand.cards);
    const bestValue = determineBestValue(values);

    // Basic estimate based on hand value and dealer's up card
    let baseEV = 0;

    // Simple calculation of base expected value
    if (bestValue === 21 && hand.cards.length === 2) {
        // Blackjack (approximately 1.5x payout)
        baseEV = 1.5;
    } else if (bestValue > 21) {
        // Bust
        baseEV = -1;
    } else if (bestValue >= 17) {
        // Strong hand
        baseEV = 0.5 + (bestValue - 17) * 0.1;
    } else {
        // Weaker hand, depends more on dealer bust probability
        baseEV = -0.2 + dealerBustProb * 1.2;
    }

    // Adjust for specific actions
    switch (action) {
        case 'double':
            // Double action doubles both potential win and loss
            return baseEV * 2;
        case 'split':
            // Split can be more complex, approximation
            return baseEV * 1.2;
        case 'surrender':
            // Surrender always returns -0.5 (half bet)
            return -0.5;
        case 'insurance':
            // Insurance has negative EV unless you're counting cards
            return baseEV - 0.08;
        default:
            // Hit or stand use base EV
            return baseEV;
    }
};

const basicStrategy = {
    getBasicStrategyAction,
    getActionExplanation,
    calculateExpectedValue,
    HARD_HAND_STRATEGY,
    SOFT_HAND_STRATEGY,
    PAIR_STRATEGY,
    SURRENDER_STRATEGY,
    LATE_SURRENDER_STRATEGY,
    INSURANCE_STRATEGY
};

export default basicStrategy;