/**
 * Game-related constants for the blackjack game application
 */

import { GameRules, CardStyleOption, CardBackOption } from '@/types/gameTypes';
import { Rank, Suit, CardColor } from '@/domains/card/cardTypes';

/**
 * Default number of decks in shoe
 */
export const DEFAULT_DECKS_COUNT = 6;

/**
 * Standard cards per deck
 */
export const CARDS_PER_DECK = 52;

/**
 * Maximum number of splits allowed by default
 */
export const DEFAULT_MAX_SPLITS = 4;

/**
 * Default minimum bet amount
 */
export const DEFAULT_MIN_BET = 5;

/**
 * Default maximum bet amount
 */
export const DEFAULT_MAX_BET = 1000;

/**
 * Default starting chips
 */
export const DEFAULT_STARTING_CHIPS = 1500;

/**
 * Card values for blackjack
 */
export const CARD_VALUES: Record<Rank, number[]> = {
    'A': [1, 11],
    '2': [2],
    '3': [3],
    '4': [4],
    '5': [5],
    '6': [6],
    '7': [7],
    '8': [8],
    '9': [9],
    '10': [10],
    'J': [10],
    'Q': [10],
    'K': [10]
};

/**
 * Suit colors
 */
export const SUIT_COLORS: Record<Suit, CardColor> = {
    'hearts': 'red',
    'diamonds': 'red',
    'clubs': 'black',
    'spades': 'black'
};

/**
 * Blackjack payout multipliers
 */
export const BLACKJACK_PAYOUTS = {
    STANDARD: 1.5,  // 3:2
    REDUCED: 1.2,   // 6:5
    EVEN: 1.0       // 1:1
};

/**
 * Insurance payout multiplier
 */
export const INSURANCE_PAYOUT = 2; // 2:1

/**
 * Vegas rules
 */
export const VEGAS_RULES: GameRules = {
    decksCount: 6,
    dealerHitsSoft17: true,
    blackjackPayout: 1.5,
    doubleAllowed: true,
    doubleAfterSplit: true,
    surrender: false,
    insuranceAvailable: true,
    maxSplits: 4,
    resplitAces: false,
    hitSplitAces: false
};

/**
 * European rules
 */
export const EUROPEAN_RULES: GameRules = {
    decksCount: 6,
    dealerHitsSoft17: false,
    blackjackPayout: 1.5,
    doubleAllowed: true,
    doubleAfterSplit: true,
    surrender: false,
    insuranceAvailable: false,
    maxSplits: 3,
    resplitAces: false,
    hitSplitAces: false
};

/**
 * Atlantic City rules
 */
export const ATLANTIC_RULES: GameRules = {
    decksCount: 8,
    dealerHitsSoft17: true,
    blackjackPayout: 1.5,
    doubleAllowed: true,
    doubleAfterSplit: true,
    surrender: true,
    insuranceAvailable: true,
    maxSplits: 3,
    resplitAces: true,
    hitSplitAces: false
};

/**
 * Classic rules
 */
export const CLASSIC_RULES: GameRules = {
    decksCount: 6,
    dealerHitsSoft17: true,
    blackjackPayout: 1.5,
    doubleAllowed: true,
    doubleAfterSplit: true,
    surrender: false,
    insuranceAvailable: true,
    maxSplits: 3,
    resplitAces: false,
    hitSplitAces: false
};

/**
 * Map of variant names to rules
 */
export const GAME_VARIANT_RULES = {
    vegas: VEGAS_RULES,
    european: EUROPEAN_RULES,
    atlantic: ATLANTIC_RULES,
    classic: CLASSIC_RULES
};

/**
 * Available card styles
 */
export const CARD_STYLES: CardStyleOption[] = [
    'modern',
    'classic',
    'minimal',
    'retro'
];

/**
 * Available card back designs
 */
export const CARD_BACK_DESIGNS: CardBackOption[] = [
    'blue',
    'red',
    'abstract',
    'abstract_scene',
    'abstract_clouds',
    'astronaut',
    'cars',
    'castle',
    'fish',
    'frog'
];

/**
 * Default table colors
 */
export const DEFAULT_TABLE_COLORS = {
    VEGAS: '#076324',
    CLASSIC: '#1a5f7a',
    EUROPEAN: '#0c326b',
    ATLANTIC: '#264653'
};

/**
 * Side bet types and payouts
 */
export const SIDE_BET_PAYOUTS = {
    perfectPairs: {
        mixed: 5,      // Different color, same rank
        colored: 10,   // Same color, same rank
        perfect: 30    // Same suit, same rank
    },
    twentyOnePlusThree: {
        flush: 5,           // Same suit
        straight: 10,       // Sequential ranks
        threeOfAKind: 30,   // Same rank
        straightFlush: 40   // Sequential ranks, same suit
    },
    luckyLadies: {
        queenOfHearts: 50,   // Queen of hearts
        queenPair: 20,       // Pair of queens
        anyQueen: 10,        // Any queen
        twentyTotal: 4       // Hand totaling 20
    },
    royalMatch: {
        royalMatch: 25,      // King and Queen of same suit
        suitedBlackjack: 5,  // A and 10/J/Q/K of same suit
        suitedPair: 3,       // Pair of same suit
        suitedCards: 2.5     // Any two cards of same suit
    }
};

/**
 * Betting system types
 */
export const BETTING_SYSTEM_TYPES = [
    'flat',
    'martingale',
    'paroli',
    'oneThreeTwoSix',
    'd_alembert',
    'fibonacci'
];