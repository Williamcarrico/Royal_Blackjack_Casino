/**
 * Deck slice for the blackjack game store
 */
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { DeckSlice } from '../../types/storeTypes';
import { Card, Deck, Shoe, Rank, Suit, ShuffleMethod } from '../../types/cardTypes';

// Card values mapping
const CARD_VALUES: Record<Rank, number | number[]> = {
    'A': [1, 11],
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 10,
    'Q': 10,
    'K': 10
};

// All possible suits
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

// All possible ranks
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Creates a deck of cards
 */
const createDeck = (): Deck => {
    const cards: Card[] = [];

    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            cards.push({
                id: uuidv4(),
                suit,
                rank,
                value: CARD_VALUES[rank],
                face: 'down'
            });
        });
    });

    return {
        id: uuidv4(),
        cards,
        remaining: cards.length,
        isShuffled: false,
        createdAt: new Date()
    };
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
const fisherYatesShuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

/**
 * Creates the deck slice
 */
const createDeckSlice: StateCreator<DeckSlice> = (set, get) => ({
    shoe: null,
    isShuffling: false,
    cardsDealt: 0,

    createShoe: (numberOfDecks, penetration = 0.75) => {
        set({ isShuffling: true });

        // Create specified number of decks
        const decks: Deck[] = [];
        for (let i = 0; i < numberOfDecks; i++) {
            decks.push(createDeck());
        }

        // Combine all cards from all decks
        const allCards = decks.flatMap(deck => deck.cards);

        // Calculate cut card position based on penetration
        const cutCardPosition = Math.floor(allCards.length * (1 - penetration));

        // Create shoe
        const shoe: Shoe = {
            id: uuidv4(),
            decks,
            cards: [...allCards], // Make a copy to ensure referential integrity
            remaining: allCards.length,
            penetration: penetration,
            cutCardPosition: cutCardPosition,
            isShuffled: false
        };

        set({
            shoe,
            isShuffling: false,
            cardsDealt: 0
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

        // Shuffle cards using Fisher-Yates
        const shuffledCards = fisherYatesShuffle(shoe.cards);

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

    // Rename dealCard to drawCard to match the function name expected in useDeck
    drawCard: (isFaceUp = true) => {
        const { shoe, cardsDealt } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        if (cardsDealt >= shoe.cards.length) {
            throw new Error('No cards remaining in shoe');
        }

        // Get the next card from the shoe
        const card = {
            ...shoe.cards[cardsDealt],
            face: isFaceUp ? 'up' : 'down'
        };

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

    // Add burnCard method to discard a card without using it
    burnCard: () => {
        const { shoe, cardsDealt } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        if (cardsDealt >= shoe.cards.length) {
            throw new Error('No cards remaining in shoe');
        }

        // Get the next card from the shoe (but don't return it)
        const card = { ...shoe.cards[cardsDealt] };

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

    // Add setShoePosition method to manually adjust the shoe position
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

    // Add getCutCard method to get the current cut card position
    getCutCard: () => {
        const { shoe } = get();

        if (!shoe) {
            throw new Error('Shoe not created');
        }

        return shoe.cutCardPosition;
    },

    // Add updateCutCard method to set a new cut card position
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

    // Add hasReachedCutCard method to check if we've dealt past the cut card
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