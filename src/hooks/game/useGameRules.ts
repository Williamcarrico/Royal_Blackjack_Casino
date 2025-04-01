/**
 * Hook for accessing and customizing Blackjack game rules
 */
import { useCallback, useMemo, useState } from 'react';
import {
    GameRules,
    GameVariant,
    GameOptions
} from '../../types/gameTypes';
import { HandAction, Hand } from '../../types/handTypes';
import { Card } from '../../types/cardTypes';
import { Bet } from '../../types/betTypes';
import {
    getRules,
    createCustomRules,
    getAvailableVariants,
    getDefaultOptions,
    validateOptions
} from '../../domains/rules/ruleFactory';
import classicRules from '../../domains/rules/variants/classicRules';

/**
 * Hook for managing game rules
 */
export function useGameRules(initialVariant: GameVariant = 'classic') {
    const [currentVariant, setCurrentVariant] = useState<GameVariant>(initialVariant);
    const [customOptions, setCustomOptions] = useState<Partial<GameOptions>>({});

    /**
     * Get all available game variants
     */
    const availableVariants = useMemo((): GameVariant[] => {
        return getAvailableVariants();
    }, []);

    /**
     * Get the rules for the current variant
     */
    const rules = useMemo((): GameRules => {
        try {
            // If we have custom options, merge them with base variant
            if (Object.keys(customOptions).length > 0) {
                return createCustomRules(currentVariant, customOptions);
            }

            // Otherwise, get standard rules
            return getRules(currentVariant);
        } catch (error) {
            // Fallback to classic rules if there's an error
            console.error('Error getting game rules:', error);
            return classicRules;
        }
    }, [currentVariant, customOptions]);

    /**
     * Get the options for the current variant
     */
    const options = useMemo((): GameOptions => {
        // Start with default options for the variant
        const defaultOptions = getDefaultOptions(currentVariant);

        // Merge with custom options
        return {
            ...defaultOptions,
            ...customOptions
        };
    }, [currentVariant, customOptions]);

    /**
     * Change the game variant
     */
    const changeVariant = useCallback((variant: GameVariant): void => {
        setCurrentVariant(variant);

        // Reset custom options when changing variant
        setCustomOptions({});
    }, []);

    /**
     * Update custom game options
     */
    const updateOptions = useCallback((newOptions: Partial<GameOptions>): string[] => {
        // Validate the options
        const errors = validateOptions(newOptions);

        if (errors.length === 0) {
            // If valid, update options
            setCustomOptions(prevOptions => ({
                ...prevOptions,
                ...newOptions
            }));
        }

        return errors;
    }, []);

    /**
     * Reset options to default for current variant
     */
    const resetOptions = useCallback((): void => {
        setCustomOptions({});
    }, []);

    /**
     * Get available actions for a hand based on current rules
     */
    const getAvailableActions = useCallback((
        hand: Hand,
        dealerUpCard?: Card
    ): HandAction[] => {
        return rules.getAvailableActions(hand, dealerUpCard);
    }, [rules]);

    /**
     * Check if a hand is a blackjack based on current rules
     */
    const isBlackjack = useCallback((hand: Hand): boolean => {
        return rules.isBlackjack(hand);
    }, [rules]);

    /**
     * Calculate payout for a bet based on current rules
     */
    const calculatePayout = useCallback((bet: Bet, result: string): number => {
        return rules.calculatePayout(bet, result);
    }, [rules]);

    /**
     * Determine if dealer should hit based on current rules
     */
    const shouldDealerHit = useCallback((dealerValue: number): boolean => {
        return rules.dealerMustHitOn(dealerValue);
    }, [rules]);

    /**
     * Determine if dealer should stand based on current rules
     */
    const shouldDealerStand = useCallback((dealerValue: number): boolean => {
        return rules.dealerMustStandOn(dealerValue);
    }, [rules]);

    /**
     * Check if a specific action is allowed by current rules
     */
    const isActionAllowed = useCallback((action: HandAction): boolean => {
        return options.allowedActions.includes(action);
    }, [options]);

    /**
     * Get variant description
     */
    const getVariantDescription = useCallback((variant: GameVariant = currentVariant): string => {
        try {
            const variantRules = getRules(variant);
            return variantRules.description;
        } catch {
            return 'Unknown variant';
        }
    }, [currentVariant]);

    /**
     * Get summary of current rules
     */
    const getRulesSummary = useMemo(() => {
        return {
            variant: options.variant,
            numberOfDecks: options.numberOfDecks,
            dealerHitsSoft17: options.dealerHitsSoft17,
            blackjackPays: options.blackjackPays,
            doubleAfterSplit: options.doubleAfterSplit,
            resplitAces: options.resplitAces,
            lateSurrender: options.lateSurrender,
            maxSplitHands: options.maxSplitHands,
            allowedActions: options.allowedActions,
            minimumBet: options.tableLimits.minimumBet,
            maximumBet: options.tableLimits.maximumBet
        };
    }, [options]);

    /**
     * Compare different rule variants
     */
    const compareVariants = useCallback((
        variantA: GameVariant,
        variantB: GameVariant
    ): Record<string, { a: unknown; b: unknown; difference: boolean }> => {
        const rulesA = getRules(variantA);
        const rulesB = getRules(variantB);

        const optionsA = rulesA.options;
        const optionsB = rulesB.options;

        const comparison: Record<string, { a: unknown; b: unknown; difference: boolean }> = {};

        // Compare basic options
        for (const key of [
            'numberOfDecks',
            'dealerHitsSoft17',
            'blackjackPays',
            'doubleAfterSplit',
            'resplitAces',
            'lateSurrender',
            'maxSplitHands'
        ] as const) {
            comparison[key] = {
                a: optionsA[key],
                b: optionsB[key],
                difference: optionsA[key] !== optionsB[key]
            };
        }

        // Compare table limits
        comparison['minimumBet'] = {
            a: optionsA.tableLimits.minimumBet,
            b: optionsB.tableLimits.minimumBet,
            difference: optionsA.tableLimits.minimumBet !== optionsB.tableLimits.minimumBet
        };

        comparison['maximumBet'] = {
            a: optionsA.tableLimits.maximumBet,
            b: optionsB.tableLimits.maximumBet,
            difference: optionsA.tableLimits.maximumBet !== optionsB.tableLimits.maximumBet
        };

        // Compare allowed actions
        comparison['allowedActions'] = {
            a: optionsA.allowedActions,
            b: optionsB.allowedActions,
            difference: JSON.stringify(optionsA.allowedActions) !== JSON.stringify(optionsB.allowedActions)
        };

        return comparison;
    }, []);

    /**
     * Get house edge based on current rules
     */
    const calculateHouseEdge = useMemo((): number => {
        // Basic house edge calculation based on rules
        // These are approximations based on common rule variations

        // Start with base house edge
        let houseEdge = 0.5; // Base house edge in percent

        // Adjust for number of decks
        if (options.numberOfDecks === 1) {
            houseEdge -= 0.48;
        } else if (options.numberOfDecks === 2) {
            houseEdge -= 0.36;
        } else if (options.numberOfDecks === 4) {
            houseEdge -= 0.16;
        } else if (options.numberOfDecks === 6) {
            houseEdge -= 0.06;
        } else if (options.numberOfDecks === 8) {
            houseEdge -= 0.02;
        }

        // Adjust for blackjack payout
        if (options.blackjackPays === 1.5) { // 3:2
            houseEdge -= 1.39;
        } else if (options.blackjackPays === 1.2) { // 6:5
            houseEdge += 1.36;
        }

        // Adjust for dealer hitting soft 17
        if (options.dealerHitsSoft17) {
            houseEdge += 0.22;
        }

        // Adjust for double after split
        if (options.doubleAfterSplit) {
            houseEdge -= 0.14;
        }

        // Adjust for late surrender
        if (options.lateSurrender) {
            houseEdge -= 0.08;
        }

        // Adjust for resplit aces
        if (options.resplitAces) {
            houseEdge -= 0.06;
        }

        return parseFloat(houseEdge.toFixed(2));
    }, [options]);

    return {
        // State
        currentVariant,
        rules,
        options,
        availableVariants,

        // Actions
        changeVariant,
        updateOptions,
        resetOptions,

        // Rule helpers
        getAvailableActions,
        isBlackjack,
        calculatePayout,
        shouldDealerHit,
        shouldDealerStand,
        isActionAllowed,

        // Information
        getVariantDescription,
        getRulesSummary,
        compareVariants,
        calculateHouseEdge
    };
}

export default useGameRules;