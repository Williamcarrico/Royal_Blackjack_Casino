'use client';

import { useMemo } from 'react';
import { useStore } from '../../store';
import * as handCalculator from '../../domains/hands/handCalculator';
import { Hand, DealerHand } from '../../types/handTypes';
import { HandId } from '../../types/storeTypes';

// Type guard to check if a hand is a Hand type
function isHand(hand: Hand | DealerHand): hand is Hand {
    return 'bet' in hand && 'isDoubled' in hand && 'isSplit' in hand;
}

/**
 * A hook for evaluating a hand's state based on its ID
 * This serves as a derived selector for hand properties
 */
export function useHandEvaluation(handId?: 'dealer' | HandId) {
    const store = useStore();

    return useMemo(() => {
        // Default return value if no hand ID is provided
        if (!handId) {
            return {
                hand: null,
                cards: [],
                values: [],
                bestValue: 0,
                isBlackjack: false,
                isBusted: false,
                isSoft: false,
                isPair: false,
                description: ''
            };
        }

        // Determine if this is a dealer hand or player hand
        let hand: Hand | DealerHand | null = null;

        if (handId === 'dealer') {
            hand = store.dealerHand;
        } else {
            const id = typeof handId === 'string' ? handId : handId.id;
            hand = store.playerHands.find((h: { id: string; }) => h.id === id) ?? null;
        }

        // If hand doesn't exist, return default values
        if (!hand) {
            return {
                hand: null,
                cards: [],
                values: [],
                bestValue: 0,
                isBlackjack: false,
                isBusted: false,
                isSoft: false,
                isPair: false,
                description: ''
            };
        }

        // Calculate all the derived properties
        const isBlackjack = handCalculator.isBlackjack(hand);
        const isBusted = handCalculator.isBusted(hand);
        const isSoft = handCalculator.isSoft(hand);

        // Use different isPair implementation based on hand type
        let isPair = false;
        if (isHand(hand)) {
            isPair = handCalculator.isPair(hand);
        }

        // Generate a descriptive string for the hand
        let description = '';
        if (isBlackjack) {
            description = 'Blackjack!';
        } else if (isBusted) {
            description = 'Busted';
        } else if (isSoft) {
            description = `Soft ${hand.bestValue}`;
        } else if (isPair && isHand(hand) && hand.cards.length === 2) {
            description = `Pair of ${hand.cards[0]?.rank}s`;
        } else {
            description = `${hand.bestValue}`;
        }

        return {
            hand,
            cards: hand.cards,
            values: hand.values,
            bestValue: hand.bestValue,
            isBlackjack,
            isBusted,
            isSoft,
            isPair,
            description
        };
    }, [handId, store.playerHands, store.dealerHand]);
}

/**
 * A hook for evaluating all player hands at once
 */
export function usePlayerHandsEvaluation() {
    const playerHands = useStore((state: { playerHands: Hand[]; }) => state.playerHands);

    return useMemo(() => {
        return playerHands.map((hand: Hand) => {
            const isBlackjack = handCalculator.isBlackjack(hand);
            const isBusted = handCalculator.isBusted(hand);
            const isSoft = handCalculator.isSoft(hand);
            const isPair = handCalculator.isPair(hand);

            return {
                hand,
                id: hand.id,
                cards: hand.cards,
                values: hand.values,
                bestValue: hand.bestValue,
                isBlackjack,
                isBusted,
                isSoft,
                isPair
            };
        });
    }, [playerHands]);
}

/**
 * A hook for evaluating the dealer's hand
 */
export function useDealerHandEvaluation() {
    return useHandEvaluation('dealer');
}