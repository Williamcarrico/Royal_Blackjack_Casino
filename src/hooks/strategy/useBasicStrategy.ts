/**
 * Hook for providing Blackjack basic strategy recommendations
 */
import { useCallback, useMemo } from 'react';
import {
    Card,
    Rank
} from '../../types/cardTypes';
import {
    Hand,
    HandAction
} from '../../types/handTypes';
import {
    GameOptions
} from '../../types/gameTypes';
import {
    getBasicStrategyAction,
    getActionExplanation as getStrategyExplanation
} from '../../domains/strategy/basicStrategy';
import {
    calculateValues,
    determineBestValue
} from '../../domains/hands/handCalculator';

// Import strategy tables from basicStrategy
// These would need to be exported from that file
// For now we'll define them here as they're used internally
type StrategyTable = Record<number | string, Record<Rank, HandAction>>;

// Example strategy tables - these should match what's in basicStrategy.ts
const HARD_HAND_STRATEGY: StrategyTable = {};
const SOFT_HAND_STRATEGY: StrategyTable = {};
const PAIR_STRATEGY: StrategyTable = {};

/**
 * Hook for Blackjack basic strategy recommendations
 */
export function useBasicStrategy(gameOptions?: GameOptions) {
    // Default options if not provided
    const options = useMemo(() => {
        if (gameOptions) return gameOptions;

        // Create default options
        // Using unknown conversion to satisfy TypeScript without type assertion
        return {
            variant: 'classic',
            numberOfDecks: 6,
            dealerHitsSoft17: true,
            allowSurrender: true,
            allowDoubleAfterSplit: true,
            maxSplitHands: 4,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: false,
            penetration: 0.75,
            tableLimits: {
                minimumBet: 5,
                maximumBet: 500
            },
            payoutRules: { blackjack: 1.5 },
            allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
            availableSideBets: []
        } as unknown as GameOptions;
    }, [gameOptions]);

    /**
     * Get basic strategy charts for current game options
     */
    const strategyCharts = useMemo(() => {
        return {
            hard: HARD_HAND_STRATEGY,
            soft: SOFT_HAND_STRATEGY,
            pairs: PAIR_STRATEGY
        };
    }, []);

    /**
     * Get recommended action based on basic strategy
     */
    const getRecommendedAction = useCallback((
        playerHand: Hand,
        dealerUpCard: Card
    ): HandAction => {
        return getBasicStrategyAction(playerHand, dealerUpCard, options);
    }, [options]);

    /**
     * Get explanation for a recommended action
     */
    const getActionExplanation = useCallback((
        playerHand: Hand,
        dealerUpCard: Card,
        action: HandAction
    ): string => {
        // Generate explanation directly using the imported function
        return getStrategyExplanation(
            playerHand,
            dealerUpCard,
            action
        );
    }, []);

    /**
     * Check if a hand action follows basic strategy
     */
    const isActionCorrect = useCallback((
        playerHand: Hand,
        dealerUpCard: Card,
        action: HandAction
    ): boolean => {
        const recommendedAction = getRecommendedAction(playerHand, dealerUpCard);
        return action === recommendedAction;
    }, [getRecommendedAction]);

    /**
     * Get recommended action for a pair hand
     */
    const getPairAction = useCallback((
        pairValue: number,
        dealerUpCardRank: Rank
    ): HandAction => {
        const pairChart = strategyCharts.pairs;
        return pairChart[pairValue]?.[dealerUpCardRank] ?? 'hit';
    }, [strategyCharts]);

    /**
     * Get recommended action for a soft hand
     */
    const getSoftAction = useCallback((
        handValue: number,
        dealerUpCardRank: Rank
    ): HandAction => {
        const softChart = strategyCharts.soft;
        return softChart[handValue]?.[dealerUpCardRank] ?? 'hit';
    }, [strategyCharts]);

    /**
     * Get recommended action for a hard hand
     */
    const getHardAction = useCallback((
        handValue: number,
        dealerUpCardRank: Rank
    ): HandAction => {
        const hardChart = strategyCharts.hard;
        return hardChart[handValue]?.[dealerUpCardRank] ?? 'hit';
    }, [strategyCharts]);

    /**
     * Analyze a player's action for training purposes
     */
    const analyzeAction = useCallback((
        playerHand: Hand,
        dealerUpCard: Card,
        chosenAction: HandAction
    ): {
        isCorrect: boolean;
        recommendedAction: HandAction;
        explanation: string;
    } => {
        const recommendedAction = getRecommendedAction(playerHand, dealerUpCard);
        const isCorrect = recommendedAction === chosenAction;

        const explanation = getActionExplanation(
            playerHand,
            dealerUpCard,
            recommendedAction
        );

        return {
            isCorrect,
            recommendedAction,
            explanation
        };
    }, [getRecommendedAction, getActionExplanation]);

    /**
     * Get the complete strategy table for a specific hand type
     */
    const getStrategyTable = useCallback((
        type: 'hard' | 'soft' | 'pairs'
    ): Record<number | string, Record<Rank, HandAction>> => {
        return strategyCharts[type] ?? {};
    }, [strategyCharts]);

    /**
     * Calculate hit success probability based on hand value
     */
    const getHitSuccessProbability = useCallback((bestValue: number): number => {
        if (bestValue <= 11) return 1.0;   // Can't bust
        if (bestValue <= 12) return 0.85;
        if (bestValue <= 13) return 0.75;
        if (bestValue <= 14) return 0.65;
        if (bestValue <= 15) return 0.55;
        if (bestValue <= 16) return 0.45;
        return 0.35;  // 17+
    }, []);

    /**
     * Calculate stand success probability based on hand value
     */
    const getStandSuccessProbability = useCallback((bestValue: number): number => {
        if (bestValue < 12) return 0.2;  // Very low chance standing with low value
        if (bestValue < 15) return 0.3;
        if (bestValue < 17) return 0.4;
        if (bestValue < 19) return 0.55;
        if (bestValue < 21) return 0.7;
        return 0.9;  // 21
    }, []);

    /**
     * Calculate double success probability based on hand value
     */
    const getDoubleSuccessProbability = useCallback((bestValue: number): number => {
        if (bestValue <= 9) return 0.9;
        if (bestValue <= 11) return 0.8;
        if (bestValue <= 13) return 0.5;
        return 0.3;  // 14+
    }, []);

    /**
     * Calculate split success probability based on card value
     */
    const getSplitSuccessProbability = useCallback((cards: Card[]): number => {
        // Make sure we have cards before accessing value
        if (!cards.length) return 0.5;

        const pairValue = cards[0]?.value;
        if (typeof pairValue === 'number') {
            if (pairValue === 8 || pairValue === 11) return 0.9;  // Aces, 8s
            if (pairValue === 9) return 0.7;
            if (pairValue === 7) return 0.6;
            if (pairValue === 2 || pairValue === 3 || pairValue === 6) return 0.5;
            if (pairValue === 4) return 0.4;
            return 0.3;  // 5, 10
        }
        return 0.5; // Default
    }, []);

    /**
     * Get the probability of success for a given action
     */
    const getActionSuccessProbability = useCallback((
        playerHand: Hand,
        dealerUpCard: Card,
        action: HandAction
    ): number => {
        // Calculate best hand value once
        const values = calculateValues(playerHand.cards);
        const bestValue = determineBestValue(values);

        // Return probability based on action type
        switch (action) {
            case 'hit':
                return getHitSuccessProbability(bestValue);

            case 'stand':
                return getStandSuccessProbability(bestValue);

            case 'double':
                return getDoubleSuccessProbability(bestValue);

            case 'split':
                return getSplitSuccessProbability(playerHand.cards);

            case 'surrender':
                return 0.5; // Flat probability - surrendering is always giving up 50% of bet

            case 'insurance':
                return 0.3; // Only good when deck is rich in 10s

            default:
                return 0.5;
        }
    }, [getHitSuccessProbability, getStandSuccessProbability, getDoubleSuccessProbability, getSplitSuccessProbability]);

    /**
     * Get card value from rank
     */
    const getCardValueFromRank = useCallback((rank: Rank): number => {
        if (rank === 'A') {
            return 11;
        } else if (['J', 'Q', 'K', '10'].includes(rank)) {
            return 10;
        } else {
            return parseInt(rank, 10);
        }
    }, []);

    /**
     * Get a training scenario for practice
     */
    const getRandomTrainingScenario = useCallback((): {
        hand: Hand;
        dealerCard: Card;
        correctAction: HandAction;
    } => {
        // Generate a random hand and dealer up card
        const handTypes = ['hard', 'soft', 'pair'];
        const handType = handTypes[Math.floor(Math.random() * handTypes.length)];

        let playerCards: Card[] = [];

        // Create dealer card
        const dealerCardRank = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'][
            Math.floor(Math.random() * 10)
        ] as Rank;

        const dealerCard: Card = {
            id: `random-dealer-card`,
            suit: 'hearts',
            rank: dealerCardRank,
            value: getCardValueFromRank(dealerCardRank),
            face: 'up'
        };

        if (handType === 'pair') {
            // Generate a random pair
            const pairRankOptions = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'J', 'Q', 'K'];
            const pairRank = pairRankOptions[
                Math.floor(Math.random() * pairRankOptions.length)
            ] as Rank;

            const pairValue = getCardValueFromRank(pairRank);

            playerCards = [
                {
                    id: `random-player-card-1`,
                    suit: 'hearts',
                    rank: pairRank,
                    value: pairValue,
                    face: 'up'
                },
                {
                    id: `random-player-card-2`,
                    suit: 'diamonds',
                    rank: pairRank,
                    value: pairValue,
                    face: 'up'
                }
            ];
        } else if (handType === 'soft') {
            // Generate a random soft hand (one ace + another card)
            const secondRankOptions = ['2', '3', '4', '5', '6', '7', '8', '9'];
            const secondRank = secondRankOptions[
                Math.floor(Math.random() * secondRankOptions.length)
            ] as Rank;

            const secondValue = parseInt(secondRank, 10);

            playerCards = [
                {
                    id: `random-player-card-1`,
                    suit: 'hearts',
                    rank: 'A',
                    value: 11,
                    face: 'up'
                },
                {
                    id: `random-player-card-2`,
                    suit: 'diamonds',
                    rank: secondRank,
                    value: secondValue,
                    face: 'up'
                }
            ];
        } else {
            // Generate a random hard hand
            const total = Math.floor(Math.random() * 11) + 5; // 5-15

            // First card is between 2-9
            const firstRankOptions = ['2', '3', '4', '5', '6', '7', '8', '9'];
            const firstRank = firstRankOptions[
                Math.floor(Math.random() * firstRankOptions.length)
            ] as Rank;

            const firstValue = parseInt(firstRank, 10);

            // Second card makes total between 5-15
            const secondValue = total - firstValue;
            let secondRank: Rank;

            if (secondValue <= 9) {
                secondRank = secondValue.toString() as Rank;
            } else {
                const faceCardOptions = ['10', 'J', 'Q', 'K'];
                secondRank = faceCardOptions[
                    Math.floor(Math.random() * faceCardOptions.length)
                ] as Rank;
            }

            playerCards = [
                {
                    id: `random-player-card-1`,
                    suit: 'hearts',
                    rank: firstRank,
                    value: firstValue,
                    face: 'up'
                },
                {
                    id: `random-player-card-2`,
                    suit: 'diamonds',
                    rank: secondRank,
                    value: secondValue,
                    face: 'up'
                }
            ];
        }

        // Create the hand object - adjust to match the Hand interface
        const hand: Hand = {
            id: 'training-hand',
            cards: playerCards,
            values: calculateValues(playerCards),
            bestValue: determineBestValue(calculateValues(playerCards)),
            status: 'active',
            result: undefined,
            actions: ['hit', 'stand', 'double', 'split', 'surrender'],
            bet: 10,
            isDoubled: false,
            isSplit: false
        };

        // Get the correct action
        const correctAction = getRecommendedAction(hand, dealerCard);

        return {
            hand,
            dealerCard,
            correctAction
        };
    }, [getRecommendedAction, getCardValueFromRank]);

    return {
        // Strategy recommendations
        getRecommendedAction,
        getActionExplanation,
        isActionCorrect,

        // Action by hand type
        getPairAction,
        getSoftAction,
        getHardAction,

        // Strategy charts
        strategyCharts,
        getStrategyTable,

        // Analysis
        analyzeAction,
        getActionSuccessProbability,

        // Training
        getRandomTrainingScenario
    };
}

export default useBasicStrategy;