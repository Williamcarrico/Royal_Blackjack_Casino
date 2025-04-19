/**
 * Hook for calculating Blackjack hand values and probabilities
 */
import { useCallback } from 'react';
import { Card } from '../../domains/card/cardTypes';
import { Hand, HandAction, DealerHand } from '../../types/handTypes';
import { GameOptions } from '../../types/gameTypes';
import * as handCalculator from '../../domains/hands/handCalculator';
import { getBasicStrategyAction } from '../../domains/strategy/basicStrategy';

/**
 * Hook for calculating and analyzing Blackjack hands
 */
export function useHandCalculator() {
    /**
     * Calculate all possible values for a hand considering Aces
     */
    const calculateValues = useCallback((cards: Card[]): number[] => {
        return handCalculator.calculateValues(cards);
    }, []);

    /**
     * Determine the best value for a hand that doesn't exceed 21
     */
    const determineBestValue = useCallback((values: number[]): number => {
        return handCalculator.determineBestValue(values);
    }, []);

    /**
     * Check if a hand is a blackjack (21 with exactly 2 cards)
     */
    const isBlackjack = useCallback((hand: Hand): boolean => {
        return handCalculator.isBlackjack(hand);
    }, []);

    /**
     * Check if a hand is busted (value exceeds 21)
     */
    const isBusted = useCallback((hand: Hand): boolean => {
        return handCalculator.isBusted(hand);
    }, []);

    /**
     * Check if a hand is soft (contains an Ace counted as 11)
     */
    const isSoft = useCallback((hand: Hand): boolean => {
        return handCalculator.isSoft(hand);
    }, []);

    /**
     * Check if a hand is a pair (first two cards of the same rank)
     */
    const isPair = useCallback((hand: Hand): boolean => {
        return handCalculator.isPair(hand);
    }, []);

    /**
     * Get available actions for a hand
     */
    const getAvailableActions = useCallback((
        hand: Hand,
        dealerUpCard?: Card,
        options?: GameOptions
    ): HandAction[] => {
        return handCalculator.getAvailableActions(hand, dealerUpCard, options);
    }, []);

    /**
     * Calculate the probability of busting with one more card
     */
    const calculateBustProbability = useCallback((
        hand: Hand,
        remainingCards: Card[]
    ): number => {
        return handCalculator.calculateBustProbability(hand, remainingCards);
    }, []);

    /**
     * Get the basic strategy recommended action
     */
    const getStrategyAction = useCallback((
        hand: Hand,
        dealerUpCard: Card,
        options?: GameOptions
    ): HandAction => {
        return getBasicStrategyAction(hand, dealerUpCard, options);
    }, []);

    /**
     * Calculate the dealer's final hand probability distribution
     */
    const calculateDealerDistribution = useCallback((
        dealerUpCard: Card,
        hitSoft17: boolean
    ): Record<number, number> => {
        return handCalculator.calculateDealerFinalHandDistribution(dealerUpCard, hitSoft17);
    }, []);

    /**
     * Calculate the probabilities of various hand outcomes
     */
    const calculateHandOutcomeProbabilities = useCallback((
        hand: Hand,
        dealerUpCard: Card,
        hitSoft17: boolean
    ): { win: number; lose: number; push: number } => {
        return handCalculator.calculateHandOutcomeProbabilities(hand, dealerUpCard, hitSoft17);
    }, []);

    /**
     * Calculate the expected value of a hand
     */
    const calculateHandExpectedValue = useCallback((
        hand: Hand,
        dealerUpCard: Card,
        options?: GameOptions
    ): number => {
        // Get the probabilities for the hand
        const { win, lose, push } = calculateHandOutcomeProbabilities(
            hand,
            dealerUpCard,
            options?.dealerHitsSoft17 ?? true
        );

        // Calculate expected value based on probabilities
        const blackjackPayout = options?.blackjackPays ?? 1.5;

        if (isBlackjack(hand)) {
            // Blackjack pays differently
            return (win * blackjackPayout) + (push * 1) + (lose * -1);
        } else {
            // Normal hand
            return (win * 1) + (push * 0) + (lose * -1);
        }
    }, [calculateHandOutcomeProbabilities, isBlackjack]);

    /**
     * Get the card that would maximize the hand value without busting
     */
    const getBestDrawCard = useCallback((hand: Hand, remainingCards: Card[]): Card | null => {
        if (!hand.cards.length || !remainingCards.length) return null;

        const handValues = calculateValues(hand.cards);
        const bestCurrentValue = determineBestValue(handValues);

        // Already at 21, can't improve
        if (bestCurrentValue === 21) return null;

        // Group remaining cards by their impact on the hand
        const cardsByImpact: Record<string, Card[]> = {};

        for (const card of remainingCards) {
            // Make a copy of the hand with this card added
            const newCards = [...hand.cards, card];
            const newValues = calculateValues(newCards);
            const newBestValue = determineBestValue(newValues);

            // Skip cards that would bust
            if (newBestValue > 21) continue;

            // Calculate the improvement
            const improvement = newBestValue - bestCurrentValue;

            // Store by improvement value
            const key = improvement.toString();
            if (!cardsByImpact[key]) {
                cardsByImpact[key] = [];
            }
            cardsByImpact[key].push(card);
        }

        // Get the highest improvement value
        const improvements = Object.keys(cardsByImpact)
            .map(Number)
            .sort((a, b) => b - a);

        // If no non-busting cards, return null
        if (!improvements.length) return null;

        // Get a random card from the highest improvement group
        const bestCards = cardsByImpact[improvements[0].toString()];
        return bestCards[Math.floor(Math.random() * bestCards.length)];
    }, [calculateValues, determineBestValue]);

    /**
     * Evaluate a complete hand and return its description and status
     */
    const evaluateHand = useCallback((hand: Hand): {
        description: string;
        status: string;
        value: number;
        isSoft: boolean;
        isPair: boolean;
        isBlackjack: boolean;
        isBusted: boolean;
    } => {
        const handIsSoft = isSoft(hand);
        const handIsPair = isPair(hand);
        const handIsBlackjack = isBlackjack(hand);
        const handIsBusted = isBusted(hand);

        let description = '';
        let status = '';

        if (handIsBlackjack) {
            description = 'Blackjack!';
            status = 'blackjack';
        } else if (handIsBusted) {
            description = 'Bust';
            status = 'busted';
        } else if (handIsSoft) {
            description = `Soft ${hand.bestValue}`;
            status = 'active';
        } else if (handIsPair && hand.cards.length === 2) {
            description = `Pair of ${hand.cards[0].rank}'s`;
            status = 'active';
        } else {
            description = `Hard ${hand.bestValue}`;
            status = 'active';
        }

        return {
            description,
            status,
            value: hand.bestValue,
            isSoft: handIsSoft,
            isPair: handIsPair,
            isBlackjack: handIsBlackjack,
            isBusted: handIsBusted
        };
    }, [isBlackjack, isBusted, isPair, isSoft]);

    /**
     * Compare a player hand with a dealer hand and determine the result
     */
    const compareHands = useCallback((
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
    }, [isBlackjack, isBusted]);

    /**
     * Calculate the payout for a bet based on the result
     */
    const calculatePayout = useCallback((
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
    }, []);

    return {
        // Basic hand calculations
        calculateValues,
        determineBestValue,
        isBlackjack,
        isBusted,
        isSoft,
        isPair,

        // Game actions
        getAvailableActions,
        getStrategyAction,

        // Probabilities and analysis
        calculateBustProbability,
        calculateDealerDistribution,
        calculateHandOutcomeProbabilities,
        calculateHandExpectedValue,

        // Hand evaluation
        evaluateHand,
        compareHands,
        calculatePayout,
        getBestDrawCard
    };
}

export default useHandCalculator;