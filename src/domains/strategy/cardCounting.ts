/**
 * Card counting systems implementation for Blackjack
 * Provides various card counting strategies for advanced play
 */
import { Card } from '../../types/cardTypes';
import { Hand, HandAction } from '../../types/handTypes';
import { GameOptions } from '../../types/gameTypes';
import { getBasicStrategyAction } from './basicStrategy';

// Types for card counting systems
export type CountingSystem = 'hiLo' | 'hiOpt1' | 'hiOpt2' | 'omega2' | 'ko' | 'zen' | 'halves' | 'custom';

// Define CardRank type based on the ranks used in the system
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface CardCountingSystem {
    name: string;
    description: string;
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    values: Record<CardRank, number>;
    balancedCount: boolean; // Whether the count is balanced (sums to 0 with a full deck)
    tags: string[];
    authors?: string[];
    getBettingCorrelation: () => number; // How well the system correlates with betting advantage
    getPlayingEfficiency: () => number; // How well the system predicts optimal playing decisions
    getInsuranceCorrelation: () => number; // How well the system predicts when to take insurance
}

/**
 * Hi-Lo counting system (Beginner-friendly)
 * Cards 2-6 are +1, 7-9 are 0, 10-A are -1
 */
export const hiLoSystem: CardCountingSystem = {
    name: 'Hi-Lo',
    description: 'The most popular counting system; cards 2-6 are +1, 7-9 are 0, 10-A are -1',
    complexity: 'beginner',
    values: {
        '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
        '7': 0, '8': 0, '9': 0,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    },
    balancedCount: true,
    tags: ['popular', 'balanced', 'level-1'],
    authors: ['Harvey Dubner', 'Julian Braun'],
    getBettingCorrelation: () => 0.97,
    getPlayingEfficiency: () => 0.51,
    getInsuranceCorrelation: () => 0.76
};

/**
 * Hi-Opt I (Highly Optimized Technique) counting system (Intermediate)
 * Cards 2-6 are +1 (except A), 7-9 are 0, 10-K are -1, A is 0
 */
export const hiOpt1System: CardCountingSystem = {
    name: 'Hi-Opt I',
    description: 'Aces are neutral; cards 2-6 are +1, 7-9 and A are 0, 10-K are -1',
    complexity: 'intermediate',
    values: {
        '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
        '7': 0, '8': 0, '9': 0,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': 0
    },
    balancedCount: true,
    tags: ['balanced', 'level-1', 'ace-neutral'],
    authors: ['Charles Einstein'],
    getBettingCorrelation: () => 0.88,
    getPlayingEfficiency: () => 0.61,
    getInsuranceCorrelation: () => 0.85
};

/**
 * Hi-Opt II counting system (Advanced)
 * Cards 2,3,6,7 are +1, 4,5 are +2, 8,9 are 0, 10-K are -2, A is 0
 */
export const hiOpt2System: CardCountingSystem = {
    name: 'Hi-Opt II',
    description: 'Advanced system with better betting correlation; 2,3,6,7 are +1, 4,5 are +2, 8,9 are 0, 10-K are -2, A is 0',
    complexity: 'advanced',
    values: {
        '2': 1, '3': 1, '4': 2, '5': 2, '6': 1, '7': 1,
        '8': 0, '9': 0,
        '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': 0
    },
    balancedCount: true,
    tags: ['balanced', 'level-2', 'ace-neutral'],
    authors: ['Lance Humble', 'Julian Braun'],
    getBettingCorrelation: () => 0.91,
    getPlayingEfficiency: () => 0.67,
    getInsuranceCorrelation: () => 0.85
};

/**
 * Omega II counting system (Advanced)
 * Cards 2,3,7 are +1, 4,5,6 are +2, 9 is -1, 8 is 0, 10-K are -2, A is 0
 */
export const omega2System: CardCountingSystem = {
    name: 'Omega II',
    description: 'Complex system with high accuracy; 2,3,7 are +1, 4,5,6 are +2, 9 is -1, 8 is 0, 10-K are -2, A is 0',
    complexity: 'advanced',
    values: {
        '2': 1, '3': 1, '4': 2, '5': 2, '6': 2, '7': 1,
        '8': 0, '9': -1,
        '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': 0
    },
    balancedCount: true,
    tags: ['balanced', 'level-2', 'ace-neutral'],
    authors: ['Bryce Carlson'],
    getBettingCorrelation: () => 0.92,
    getPlayingEfficiency: () => 0.67,
    getInsuranceCorrelation: () => 0.85
};

/**
 * Knockout (KO) counting system (Beginner)
 * Cards 2-7 are +1, 8-9 are 0, 10-A are -1
 */
export const koSystem: CardCountingSystem = {
    name: 'Knockout (KO)',
    description: 'Unbalanced system making it easier to calculate true count; 2-7 are +1, 8-9 are 0, 10-A are -1',
    complexity: 'beginner',
    values: {
        '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1,
        '8': 0, '9': 0,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    },
    balancedCount: false,
    tags: ['unbalanced', 'level-1'],
    authors: ['Ken Fuchs', 'Olaf Vancura'],
    getBettingCorrelation: () => 0.98,
    getPlayingEfficiency: () => 0.55,
    getInsuranceCorrelation: () => 0.78
};

/**
 * Zen Count system (Expert)
 * Cards 2,3,7 are +1, 4,5,6 are +2, 8 is 0, 9 is -1, 10-K are -2, A is -1
 */
export const zenSystem: CardCountingSystem = {
    name: 'Zen Count',
    description: 'Complex system with high efficiency; 2,3,7 are +1, 4,5,6 are +2, 8 is 0, 9 is -1, 10-K are -2, A is -1',
    complexity: 'expert',
    values: {
        '2': 1, '3': 1, '4': 2, '5': 2, '6': 2, '7': 1,
        '8': 0, '9': -1,
        '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': -1
    },
    balancedCount: true,
    tags: ['balanced', 'level-2'],
    authors: ['Arnold Snyder'],
    getBettingCorrelation: () => 0.96,
    getPlayingEfficiency: () => 0.72,
    getInsuranceCorrelation: () => 0.85
};

/**
 * Halves Count (Expert)
 * Uses half-point values for greater precision
 * 2,7 are +0.5, 3,4,6 are +1, 5 is +1.5, 8 is 0, 9 is -0.5, 10-K are -1, A is -1
 */
export const halvesSystem: CardCountingSystem = {
    name: 'Halves',
    description: 'High precision fractional counting; 2,7 are +0.5, 3,4,6 are +1, 5 is +1.5, 8 is 0, 9 is -0.5, 10-K are -1, A is -1',
    complexity: 'expert',
    values: {
        '2': 0.5, '3': 1, '4': 1, '5': 1.5, '6': 1, '7': 0.5,
        '8': 0, '9': -0.5,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    },
    balancedCount: true,
    tags: ['balanced', 'fractional', 'level-3'],
    authors: ['John Gwynn'],
    getBettingCorrelation: () => 0.99,
    getPlayingEfficiency: () => 0.72,
    getInsuranceCorrelation: () => 0.91
};

/**
 * All available card counting systems
 */
export const COUNTING_SYSTEMS: Record<CountingSystem, CardCountingSystem> = {
    hiLo: hiLoSystem,
    hiOpt1: hiOpt1System,
    hiOpt2: hiOpt2System,
    omega2: omega2System,
    ko: koSystem,
    zen: zenSystem,
    halves: halvesSystem,
    custom: {
        name: 'Custom',
        description: 'User-defined custom counting system',
        complexity: 'advanced',
        values: { ...hiLoSystem.values }, // Default to Hi-Lo values
        balancedCount: true,
        tags: ['custom'],
        getBettingCorrelation: () => 0.9,
        getPlayingEfficiency: () => 0.6,
        getInsuranceCorrelation: () => 0.8
    }
};

/**
 * Get a card counting system by name
 */
export const getCountingSystem = (system: CountingSystem): CardCountingSystem => {
    return COUNTING_SYSTEMS[system] || COUNTING_SYSTEMS.hiLo;
};

/**
 * Track the running count for a set of cards
 */
export const calculateRunningCount = (
    cards: Card[],
    system: CardCountingSystem
): number => {
    return cards.reduce((count, card) => {
        // Only count face-up cards
        if (card.face) {
            return count + system.values[card.rank];
        }
        return count;
    }, 0);
};

/**
 * Calculate the true count (running count divided by decks remaining)
 */
export const calculateTrueCount = (
    runningCount: number,
    decksRemaining: number
): number => {
    // Avoid division by zero or negative decks
    if (decksRemaining <= 0) return runningCount;

    // Round to nearest 0.5 for practical use
    return Math.round(runningCount / decksRemaining * 2) / 2;
};

/**
 * Calculate the betting spread based on the true count
 * Returns a multiplier for the base bet
 */
export const calculateBettingSpread = (
    trueCount: number,
    maxSpread: number = 8
): number => {
    // Conservative betting spread based on true count
    if (trueCount <= 0) return 1; // Minimum bet
    if (trueCount >= 6) return maxSpread; // Maximum bet

    // Linear interpolation between min and max spread
    return Math.min(maxSpread, 1 + Math.floor(trueCount));
};

/**
 * Determine if a player should deviate from basic strategy based on the count
 */
export const shouldDeviateFromBasicStrategy = (
    hand: Hand,
    dealerUpCard: Card,
    trueCount: number,
    basicStrategyAction: HandAction
): boolean => {
    // Key deviations based on true count
    // These are simplified - a full list would be much more comprehensive
    const deviations: Record<string, [number, HandAction]> = {
        // Format: "player total:dealer upcard": [true count threshold, action to take]
        // Insurance
        "any:A": [3, 'insurance'], // Take insurance at true count >= 3

        // 16 vs 10
        "16:10": [0, 'stand'], // Stand on 16 vs 10 at true count >= 0
        "16:T": [0, 'stand'], // Stand on 16 vs T at true count >= 0
        "16:J": [0, 'stand'], // Stand on 16 vs J at true count >= 0
        "16:Q": [0, 'stand'], // Stand on 16 vs Q at true count >= 0
        "16:K": [0, 'stand'], // Stand on 16 vs K at true count >= 0

        // 15 vs 10
        "15:10": [4, 'stand'], // Stand on 15 vs 10 at true count >= 4
        "15:T": [4, 'stand'], // Stand on 15 vs T at true count >= 4
        "15:J": [4, 'stand'], // Stand on 15 vs J at true count >= 4
        "15:Q": [4, 'stand'], // Stand on 15 vs Q at true count >= 4
        "15:K": [4, 'stand'], // Stand on 15 vs K at true count >= 4

        // 10,10 vs 5
        "20:5": [5, 'split'], // Split 10,10 vs 5 at true count >= 5
        "20:6": [5, 'split'], // Split 10,10 vs 6 at true count >= 5

        // 12 vs 2
        "12:2": [3, 'stand'], // Stand on 12 vs 2 at true count >= 3
        "12:3": [2, 'stand'], // Stand on 12 vs 3 at true count >= 2
    };

    // Create key for lookup
    let normalizedUpCard = dealerUpCard.rank;
    if (['T', 'J', 'Q', 'K'].includes(dealerUpCard.rank)) {
        normalizedUpCard = '10';
    }

    const key = `${hand.bestValue}:${normalizedUpCard}`;

    // Special case for insurance
    if (dealerUpCard.rank === 'A' && basicStrategyAction !== 'insurance') {
        const insuranceKey = `any:A`;
        const [threshold] = deviations[insuranceKey] || [999, 'hit'];
        if (trueCount >= threshold) {
            return true;
        }
    }

    // Check for deviation
    if (deviations[key]) {
        const [threshold, deviationAction] = deviations[key];
        // If true count exceeds threshold and the action differs from basic strategy
        return trueCount >= threshold && deviationAction !== basicStrategyAction;
    }

    return false;
};

/**
 * Get the optimal action considering both basic strategy and count-based deviations
 */
export const getCountBasedAction = (
    hand: Hand,
    dealerUpCard: Card,
    trueCount: number,
    options?: GameOptions
): HandAction => {
    // First get the basic strategy action
    const basicAction = getBasicStrategyAction(hand, dealerUpCard, options);

    // Key deviations based on true count
    const deviations: Record<string, [number, HandAction]> = {
        // Format: "player total:dealer upcard": [true count threshold, action to take]
        // Insurance
        "any:A": [3, 'insurance'], // Take insurance at true count >= 3

        // 16 vs 10
        "16:10": [0, 'stand'], // Stand on 16 vs 10 at true count >= 0
        "16:T": [0, 'stand'],
        "16:J": [0, 'stand'],
        "16:Q": [0, 'stand'],
        "16:K": [0, 'stand'],

        // 15 vs 10
        "15:10": [4, 'stand'], // Stand on 15 vs 10 at true count >= 4
        "15:T": [4, 'stand'],
        "15:J": [4, 'stand'],
        "15:Q": [4, 'stand'],
        "15:K": [4, 'stand'],

        // 10,10 vs 5,6
        "20:5": [5, 'split'], // Split 10,10 vs 5 at true count >= 5
        "20:6": [5, 'split'], // Split 10,10 vs 6 at true count >= 5

        // 12 vs 2,3
        "12:2": [3, 'stand'], // Stand on 12 vs 2 at true count >= 3
        "12:3": [2, 'stand'], // Stand on 12 vs 3 at true count >= 2

        // 9 vs 2
        "9:2": [1, 'double'], // Double 9 vs 2 at true count >= 1

        // A,7 vs 2
        "18:2": [-1, 'double'], // Double A,7 vs 2 at true count >= -1

        // 10 vs A
        "10:A": [4, 'double'], // Double 10 vs A at true count >= 4

        // 8 vs 6
        "8:6": [2, 'double'], // Double 8 vs 6 at true count >= 2

        // 16 vs 9
        "16:9": [5, 'stand'], // Stand on 16 vs 9 at true count >= 5

        // 13 vs 2
        "13:2": [-1, 'stand'], // Stand on 13 vs 2 at true count >= -1
    };

    // Create key for lookup
    let normalizedUpCard = dealerUpCard.rank;
    if (['T', 'J', 'Q', 'K'].includes(dealerUpCard.rank)) {
        normalizedUpCard = '10';
    }

    const key = `${hand.bestValue}:${normalizedUpCard}`;

    // Special case for insurance
    if (dealerUpCard.rank === 'A' && basicAction !== 'insurance') {
        const insuranceKey = `any:A`;
        const [threshold] = deviations[insuranceKey] || [999, 'hit'];
        if (trueCount >= threshold && options?.allowedActions.includes('insurance')) {
            return 'insurance';
        }
    }

    // Check if we should deviate
    if (deviations[key]) {
        const [threshold, deviationAction] = deviations[key];

        // Check if the deviation is allowed
        if (deviationAction === 'split' && !options?.allowedActions.includes('split')) {
            return basicAction;
        }

        if (deviationAction === 'double' && !options?.allowedActions.includes('double')) {
            return basicAction;
        }

        // Apply deviation if true count meets or exceeds threshold
        if (trueCount >= threshold) {
            return deviationAction;
        }
    }

    // Otherwise follow basic strategy
    return basicAction;
};

/**
 * Get recommended bet size based on true count
 */
export const getRecommendedBetSize = (
    trueCount: number,
    baseBet: number,
    maxBet: number
): number => {
    const multiplier = calculateBettingSpread(trueCount);
    return Math.min(baseBet * multiplier, maxBet);
};

/**
 * Calculate the player's advantage (edge) based on true count
 * Returns approximate player advantage as a percentage
 */
export const calculatePlayerAdvantage = (trueCount: number): number => {
    // Rule of thumb: each true count point is worth ~0.5% player advantage
    // At true count 0, house has ~0.5% edge
    const baseHouseEdge = -0.5;
    const advantagePerCount = 0.5;

    return baseHouseEdge + (trueCount * advantagePerCount);
};

const cardCounting = {
    getCountingSystem,
    calculateRunningCount,
    calculateTrueCount,
    calculateBettingSpread,
    shouldDeviateFromBasicStrategy,
    getCountBasedAction,
    getRecommendedBetSize,
    calculatePlayerAdvantage,
    COUNTING_SYSTEMS
};

export default cardCounting;