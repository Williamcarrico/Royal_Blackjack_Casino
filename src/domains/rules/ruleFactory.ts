/**
 * Rule factory for selecting and customizing game rules
 */
import { GameRules, GameVariant, GameOptions } from '../../types/gameTypes';
import classicRules, { CLASSIC_GAME_OPTIONS } from './variants/classicRules';
import europeanRules, { EUROPEAN_GAME_OPTIONS } from './variants/europeanRules';

// Map of all available rule sets
const RULE_VARIANTS: Record<GameVariant, GameRules> = {
    'classic': classicRules,
    'european': europeanRules,
    // Other variants would be added here
    'vegas': {
        ...classicRules,
        variant: 'vegas',
        description: 'Las Vegas Strip rules: 6-8 decks, dealer stands on soft 17, late surrender, double after split allowed',
        options: {
            ...CLASSIC_GAME_OPTIONS,
            variant: 'vegas',
            dealerHitsSoft17: false, // Vegas rules typically have dealer stand on soft 17
        }
    },
    'atlantic': {
        ...classicRules,
        variant: 'atlantic',
        description: 'Atlantic City rules: 8 decks, dealer stands on soft 17, late surrender, DAS allowed',
        options: {
            ...CLASSIC_GAME_OPTIONS,
            variant: 'atlantic',
            numberOfDecks: 8,
            dealerHitsSoft17: false,
        }
    },
    'spanish21': {
        ...classicRules,
        variant: 'spanish21',
        description: 'Spanish 21: No 10 cards (only face cards), liberal doubling, special payouts for 21',
        options: {
            ...CLASSIC_GAME_OPTIONS,
            variant: 'spanish21',
            // Would need special handling for deck creation (removing 10s)
        }
    },
    'pontoon': {
        ...europeanRules,
        variant: 'pontoon',
        description: 'British Pontoon: 8 decks, dealer wins ties, 5-card 21 pays more, no hole card',
        options: {
            ...EUROPEAN_GAME_OPTIONS,
            variant: 'pontoon',
            numberOfDecks: 8,
            // Special rules for pontoon would be implemented
        }
    },
    'doubleExposure': {
        ...europeanRules,
        variant: 'doubleExposure',
        description: 'Double Exposure: Both dealer cards are face up, blackjack pays 1:1, dealer wins ties',
        options: {
            ...EUROPEAN_GAME_OPTIONS,
            variant: 'doubleExposure',
            blackjackPays: 1.2, // Double Exposure modified to 6:5 payout to match allowed types
            // Special rules for Double Exposure would be implemented
        }
    },
    'custom': {
        ...classicRules,
        variant: 'custom',
        description: 'Custom rules configured by the player',
        options: {
            ...CLASSIC_GAME_OPTIONS,
            variant: 'custom',
        }
    }
};

/**
 * Gets the rule set for a specific game variant
 */
export const getRules = (variant: GameVariant): GameRules => {
    const rules = RULE_VARIANTS[variant];

    if (!rules) {
        throw new Error(`Unknown game variant: ${variant}`);
    }

    return rules;
};

/**
 * Creates a custom rule set by merging default rules with custom options
 */
export const createCustomRules = (baseVariant: GameVariant, customOptions: Partial<GameOptions>): GameRules => {
    // Get the base rule set
    const baseRules = getRules(baseVariant);

    // Create new options by merging base options with custom options
    const mergedOptions: GameOptions = {
        ...baseRules.options,
        ...customOptions,
        variant: 'custom' // Force variant to be 'custom'
    };

    // Return a new rule set with the merged options
    return {
        ...baseRules,
        variant: 'custom',
        description: `Custom rules based on ${baseVariant} variant`,
        options: mergedOptions
    };
};

/**
 * Gets available game variants
 */
export const getAvailableVariants = (): GameVariant[] => {
    return Object.keys(RULE_VARIANTS) as GameVariant[];
};

/**
 * Gets the default options for a variant
 */
export const getDefaultOptions = (variant: GameVariant): GameOptions => {
    const rules = getRules(variant);
    return rules.options;
};

/**
 * Validates number of decks option
 */
const validateNumberOfDecks = (numberOfDecks?: number): string[] => {
    if (numberOfDecks === undefined) return [];
    return (numberOfDecks < 1 || numberOfDecks > 8)
        ? ['Number of decks must be between 1 and 8']
        : [];
};

/**
 * Validates blackjack payout option
 */
const validateBlackjackPayout = (blackjackPays?: number): string[] => {
    if (blackjackPays === undefined) return [];
    return (blackjackPays !== 1.5 && blackjackPays !== 1.2)
        ? ['Blackjack payout must be either 1.5 (3:2) or 1.2 (6:5)']
        : [];
};

/**
 * Validates table limits options
 */
const validateTableLimits = (tableLimits?: { minimumBet: number, maximumBet: number }): string[] => {
    if (!tableLimits) return [];

    const errors: string[] = [];
    if (tableLimits.minimumBet <= 0) {
        errors.push('Minimum bet must be greater than 0');
    }
    if (tableLimits.maximumBet <= tableLimits.minimumBet) {
        errors.push('Maximum bet must be greater than minimum bet');
    }

    return errors;
};

/**
 * Validates max split hands option
 */
const validateMaxSplitHands = (maxSplitHands?: number): string[] => {
    if (maxSplitHands === undefined) return [];
    return (maxSplitHands < 1 || maxSplitHands > 4)
        ? ['Maximum split hands must be between 1 and 4']
        : [];
};

/**
 * Validates penetration option
 */
const validatePenetration = (penetration?: number): string[] => {
    if (penetration === undefined) return [];
    return (penetration < 0.5 || penetration > 0.9)
        ? ['Penetration must be between 0.5 and 0.9']
        : [];
};

/**
 * Validates game options against rule constraints
 */
export const validateOptions = (options: Partial<GameOptions>): string[] => {
    return [
        ...validateNumberOfDecks(options.numberOfDecks),
        ...validateBlackjackPayout(options.blackjackPays),
        ...validateTableLimits(options.tableLimits),
        ...validateMaxSplitHands(options.maxSplitHands),
        ...validatePenetration(options.penetration)
    ];
};

const ruleFactory = {
    getRules,
    createCustomRules,
    getAvailableVariants,
    getDefaultOptions,
    validateOptions
};

export default ruleFactory;