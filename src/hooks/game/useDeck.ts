/**
 * Hook for managing Blackjack deck and shoe operations
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import createDeckSlice from '../../store/slices/deckSlice';
import {
    Card,
    Rank
} from '../../types/cardTypes';
import { GameOptions } from '../../types/gameTypes';

// Deck slice store
const useDeckStore = create(createDeckSlice);

/**
 * Hook for managing deck and card operations in Blackjack
 */
export function useDeck(gameOptions?: GameOptions) {
    const {
        shoe,
        createShoe,
        shuffleShoe,
        resetShoe,
        drawCard,
        burnCard,
        getCutCard,
        updateCutCard,
        hasReachedCutCard
    } = useDeckStore();

    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [lastDrawnCard, setLastDrawnCard] = useState<Card | null>(null);
    const [dealerHoleCard, setDealerHoleCard] = useState<Card | null>(null);

    // Default game options if not provided
    const options = useMemo(() => {
        return gameOptions || {
            variant: 'classic',
            numberOfDecks: 6,
            penetration: 0.75
        };
    }, [gameOptions]);

    /**
     * Get the point value of a card
     */
    const getCardValue = useCallback((rank: Rank): number => {
        if (rank === 'A') return 11;
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        return parseInt(rank, 10);
    }, []);

    /**
     * Initialize a new shoe with the specified number of decks
     */
    const initializeShoe = useCallback((): void => {
        const numDecks = options.numberOfDecks || 6;
        const penetration = options.penetration || 0.75;

        // Create a new shoe
        createShoe(numDecks, penetration);
    }, [options.numberOfDecks, options.penetration, createShoe]);

    /**
     * Draw a card from the shoe
     */
    const drawCardFromShoe = useCallback((isFaceUp: boolean = true): Card | null => {
        const card = drawCard(isFaceUp);

        if (card) {
            setCurrentCard(card);
            setLastDrawnCard(card);
        }

        return card;
    }, [drawCard]);

    /**
     * Draw the dealer's hole card and store it separately
     */
    const drawHoleCard = useCallback((): Card | null => {
        const card = drawCard(false);

        if (card) {
            setDealerHoleCard(card);
        }

        return card;
    }, [drawCard]);

    /**
     * Reveal the dealer's hole card
     */
    const revealHoleCard = useCallback((): Card | null => {
        if (dealerHoleCard) {
            const revealedCard = {
                ...dealerHoleCard,
                isFaceUp: true
            };

            setDealerHoleCard(revealedCard);
            return revealedCard;
        }

        return null;
    }, [dealerHoleCard]);

    /**
     * Burn a card (remove it from play without using it)
     */
    const burnCardFromShoe = useCallback((): Card | null => {
        return burnCard();
    }, [burnCard]);

    /**
     * Check if the shoe needs to be reshuffled
     */
    const needsReshuffle = useMemo((): boolean => {
        return hasReachedCutCard();
    }, [hasReachedCutCard]);

    /**
     * Get the number of cards remaining in the shoe
     */
    const cardsRemaining = useMemo((): number => {
        if (!shoe) return 0;
        return shoe.cards.length - useDeckStore.getState().cardsDealt;
    }, [shoe]);

    /**
     * Get the percentage of cards remaining in the shoe
     */
    const remainingPercentage = useMemo((): number => {
        if (!shoe || shoe.cards.length === 0) return 0;
        return (cardsRemaining / shoe.cards.length) * 100;
    }, [shoe, cardsRemaining]);

    /**
     * Get the cut card position (cards from the end)
     */
    const cutCardPosition = useMemo((): number => {
        return getCutCard();
    }, [getCutCard]);

    /**
     * Update the cut card position
     */
    const setCutCardPosition = useCallback((position: number): void => {
        updateCutCard(position);
    }, [updateCutCard]);

    /**
     * Set a custom penetration level (percentage of cards to deal before reshuffling)
     */
    const setPenetration = useCallback((penetration: number): void => {
        // Ensure penetration is between 0 and 1
        const safeValue = Math.max(0, Math.min(1, penetration));

        if (!shoe) return;

        // Calculate the number of cards to deal before reshuffling
        const totalCards = shoe.cards.length;
        const cutPosition = Math.floor(totalCards * (1 - safeValue));

        // Update the cut card position
        updateCutCard(cutPosition);
    }, [shoe, updateCutCard]);

    /**
     * Reshuffle the shoe
     */
    const reshuffleCards = useCallback((): void => {
        // Reset dealer hole card
        setDealerHoleCard(null);
        setCurrentCard(null);
        setLastDrawnCard(null);

        // Shuffle the shoe
        shuffleShoe();
    }, [shuffleShoe]);

    /**
     * Reset the shoe and create a fresh one
     */
    const resetAndCreateNewShoe = useCallback((): void => {
        // Reset dealer hole card
        setDealerHoleCard(null);
        setCurrentCard(null);
        setLastDrawnCard(null);

        // Reset the shoe
        resetShoe();

        // Create a new shoe with the specified number of decks
        const numDecks = options.numberOfDecks || 6;
        const penetration = options.penetration || 0.75;

        createShoe(numDecks, penetration);
    }, [options.numberOfDecks, options.penetration, createShoe, resetShoe]);

    /**
     * Get a count of each rank remaining in the shoe (for card counting)
     */
    const cardsDealt = useDeckStore(state => state.cardsDealt);

    const remainingCardDistribution = useMemo((): Record<Rank, number> => {
        // Initialize count for each rank
        const distribution: Record<Rank, number> = {
            'A': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0,
            '8': 0, '9': 0, '10': 0, 'J': 0, 'Q': 0, 'K': 0
        };

        if (!shoe) return distribution;

        // Count remaining cards by rank
        const remainingCards = shoe.cards.slice(cardsDealt);

        for (const card of remainingCards) {
            distribution[card.rank]++;
        }

        return distribution;
    }, [shoe, cardsDealt]);

    /**
     * Calculate the probability of drawing a card with a specific value
     */
    const calculateDrawProbability = useCallback((value: number): number => {
        if (!shoe || cardsRemaining === 0) return 0;

        // Count cards with the specified value
        const remainingCards = shoe.cards.slice(cardsDealt);
        const cardsWithValue = remainingCards.filter(card => {
            const cardValue = getCardValue(card.rank);
            return cardValue === value || (value === 10 && cardValue === 10);
        });

        return cardsWithValue.length / cardsRemaining;
    }, [shoe, cardsRemaining, getCardValue, cardsDealt]);

    /**
     * Calculate the probability of dealer busting given their up card
     */
    const calculateDealerBustProbability = useCallback((upCardRank: Rank): number => {
        // Basic probabilities based on dealer's up card
        // These are approximations and would be more precise with a proper simulation
        const bustProbabilities: Record<Rank, number> = {
            'A': 0.12,
            '2': 0.35,
            '3': 0.37,
            '4': 0.40,
            '5': 0.42,
            '6': 0.42,
            '7': 0.26,
            '8': 0.24,
            '9': 0.23,
            '10': 0.21,
            'J': 0.21,
            'Q': 0.21,
            'K': 0.21
        };

        // Adjust probabilities based on card distribution
        // This is a simplified approach
        const totalCards = cardsRemaining;

        if (totalCards === 0) return bustProbabilities[upCardRank];

        // Adjust probability based on the distribution of high and low cards
        const highCards = remainingCardDistribution['10'] +
            remainingCardDistribution['J'] +
            remainingCardDistribution['Q'] +
            remainingCardDistribution['K'];
        const highCardRatio = highCards / totalCards;
        const averageRatio = (options.numberOfDecks * 16) / (options.numberOfDecks * 52); // Expected ratio in a fresh shoe

        // If there are proportionally more high cards left, dealer bust probability increases
        const adjustmentFactor = highCardRatio / averageRatio;

        return bustProbabilities[upCardRank] * adjustmentFactor;
    }, [remainingCardDistribution, cardsRemaining, options.numberOfDecks]);

    // Initialize the shoe when the hook is first used or when game options change
    useEffect(() => {
        if (!shoe?.cards?.length) {
            initializeShoe();
        }
    }, [initializeShoe, shoe]);

    return {
        // State
        shoe,
        currentCard,
        lastDrawnCard,
        dealerHoleCard,
        cardsRemaining,
        remainingPercentage,
        needsReshuffle,

        // Card operations
        drawCardFromShoe,
        drawHoleCard,
        revealHoleCard,
        burnCardFromShoe,

        // Shoe operations
        initializeShoe,
        reshuffleCards,
        resetAndCreateNewShoe,

        // Cut card operations
        cutCardPosition,
        setCutCardPosition,
        setPenetration,

        // Analysis utilities
        remainingCardDistribution,
        calculateDrawProbability,
        calculateDealerBustProbability
    };
}

export default useDeck;