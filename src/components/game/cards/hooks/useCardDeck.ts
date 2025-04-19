'use client';

/**
 * Hook for managing card deck operations in Blackjack
 */
import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import createDeckSlice from '../../store/slices/deckSlice';
import {
    Card,
    Deck,
    Shoe,
    ShuffleMethod
} from '../../domains/card/cardTypes';
import {
    createDeck,
    createDecks,
    shuffleCards,
    needsReshuffle,
    cardToString,
    getCardImagePath
} from '../core/deckUtils';

// Deck slice store
const useDeckStore = create(createDeckSlice);

/**
 * Hook for managing card decks and operations
 */
export function useCardDeck() {
    const { shoe, isShuffling, cardsDealt, createShoe, shuffleShoe, drawCard, burnCard, resetShoe } = useDeckStore();

    /**
     * Initialize a shoe of multiple decks
     */
    const initializeShoe = useCallback((numberOfDecks: number = 6, penetration: number = 0.75): Shoe => {
        createShoe(numberOfDecks, penetration);

        if (!shoe) {
            throw new Error('Failed to create shoe');
        }

        return shoe;
    }, [createShoe, shoe]);

    /**
     * Shuffle the current shoe
     */
    const shuffle = useCallback(() => {
        shuffleShoe();
    }, [shuffleShoe]);

    /**
     * Deal a card from the shoe
     */
    const deal = useCallback((faceUp: boolean = true): Card => {
        try {
            return drawCard(faceUp);
        } catch (error) {
            throw new Error(`Failed to deal card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [drawCard]);

    /**
     * Deal multiple cards at once
     */
    const dealMultiple = useCallback((count: number, faceUp: boolean = true): Card[] => {
        const cards: Card[] = [];

        try {
            for (let i = 0; i < count; i++) {
                cards.push(deal(faceUp));
            }

            return cards;
        } catch (error) {
            throw new Error(`Failed to deal multiple cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [deal]);

    /**
     * Burn a card (remove it from play without using it)
     */
    const burnCardFromShoe = useCallback((): Card | null => {
        return burnCard();
    }, [burnCard]);

    /**
     * Reset the shoe to initial state
     */
    const reset = useCallback(() => {
        resetShoe();
    }, [resetShoe]);

    /**
     * Check if the shoe needs to be reshuffled (penetration reached)
     */
    const shouldReshuffle = useMemo((): boolean => {
        if (!shoe) return false;
        return needsReshuffle(shoe, cardsDealt);
    }, [shoe, cardsDealt]);

    /**
     * Get remaining cards count
     */
    const remainingCards = useMemo((): number => {
        if (!shoe) return 0;
        return shoe.cards.length - cardsDealt;
    }, [shoe, cardsDealt]);

    /**
     * Get estimated number of decks remaining
     */
    const decksRemaining = useMemo((): number => {
        if (!shoe) return 0;
        const cardsPerDeck = 52;
        return remainingCards / cardsPerDeck;
    }, [remainingCards, shoe]);

    return {
        // Core deck creation functions (expose these from the utility)
        createDeck,
        createDecks,
        shuffleCards,

        // State
        shoe,
        isShuffling,
        cardsDealt,
        remainingCards,
        decksRemaining,
        needsReshuffle: shouldReshuffle,

        // Actions
        initializeShoe,
        shuffle,
        deal,
        dealMultiple,
        burnCard: burnCardFromShoe,
        reset,

        // Helpers
        cardToString,
        getCardImagePath
    };
}

export default useCardDeck;