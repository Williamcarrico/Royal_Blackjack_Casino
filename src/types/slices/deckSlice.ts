'use client';

/**
 * Deck slice for the blackjack game store
 */
import { StateCreator } from 'zustand';
import { DeckSlice } from '../../types/storeTypes';
import { Card, Shoe } from '../../domains/card/cardTypes';
import { createShoe, shuffleCards, flipCard } from '../../domains/card/cardFactory';

/**
 * Creates the deck slice
 */
const createDeckSlice: StateCreator<DeckSlice> = (set, get) => ({
    shoe: null,
    isShuffling: false,
    cardsDealt: 0,
    penetration: 0.75, // Default penetration value (persisted in state)

    createShoe: (numberOfDecks, penetration = 0.75) => {
        set({ isShuffling: true });

        // Use the cardFactory to create the shoe
        const shoe = createShoe({
            numberOfDecks,
            includeJokers: false
        });

        // Update penetration values
        shoe.penetration = penetration;
        shoe.cutCardPosition = Math.floor(shoe.cards.length * (1 - penetration));

        set({
            shoe,
            isShuffling: false,
            cardsDealt: 0,
            penetration // Store the penetration value in state
        });

        // Shuffle the newly created shoe
        get().shuffleShoe();
    },

    shuffleShoe: () => {
        set({ isShuffling: true });

        const { shoe } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        // Use the cardFactory's shuffle function
        const shuffledCards = shuffleCards(shoe.cards);

        // Update shoe with shuffled cards
        set({
            shoe: {
                ...shoe,
                cards: shuffledCards,
                isShuffled: true
            },
            isShuffling: false,
            cardsDealt: 0
        });
    },

    drawCard: (isFaceUp = true) => {
        const { shoe, cardsDealt } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        if (cardsDealt >= shoe.cards.length) {
            throw new Error('No cards remaining in shoe');
        }

        // We've already checked that cardsDealt is within the array bounds,
        // so we can safely use non-null assertion here
        const cardFromShoe = shoe.cards[cardsDealt]!;

        // Use flipCard function to ensure consistent face handling
        const card = flipCard({
            id: cardFromShoe.id,
            suit: cardFromShoe.suit,
            value: cardFromShoe.value,
            faceUp: isFaceUp
        }, isFaceUp);

        // Update state
        set({
            shoe: {
                ...shoe,
                remaining: shoe.remaining - 1
            },
            cardsDealt: cardsDealt + 1
        });

        return card;
    },

    burnCard: () => {
        const { shoe, cardsDealt } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        if (cardsDealt >= shoe.cards.length) {
            throw new Error('No cards remaining in shoe');
        }

        const cardFromShoe = shoe.cards[cardsDealt]!;
        const card: Card = {
            id: cardFromShoe.id,
            suit: cardFromShoe.suit,
            value: cardFromShoe.value,
            faceUp: cardFromShoe.faceUp,
            face: cardFromShoe.face
        };

        // Update state to skip this card
        set({
            shoe: {
                ...shoe,
                remaining: shoe.remaining - 1
            },
            cardsDealt: cardsDealt + 1
        });

        return card;
    },

    setShoePosition: (position) => {
        const { shoe } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        if (position < 0 || position > shoe.cards.length) {
            throw new Error('Invalid shoe position');
        }

        set({
            cardsDealt: position,
            shoe: {
                ...shoe,
                remaining: shoe.cards.length - position
            }
        });
    },

    getCutCard: () => {
        const { shoe } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        return shoe.cutCardPosition;
    },

    updateCutCard: (position) => {
        const { shoe } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        if (position < 0 || position > shoe.cards.length) {
            throw new Error('Invalid cut card position');
        }

        set({
            shoe: {
                ...shoe,
                cutCardPosition: position
            }
        });
    },

    hasReachedCutCard: () => {
        const { shoe, cardsDealt } = get();

        if (!shoe) {
            return false;
        }

        return cardsDealt >= shoe.cards.length - shoe.cutCardPosition;
    },

    resetShoe: () => {
        set({
            shoe: null,
            isShuffling: false,
            cardsDealt: 0
        });
    }
});

export default createDeckSlice;