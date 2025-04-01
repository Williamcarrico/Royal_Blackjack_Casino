/**
 * Card factory functions for creating and managing cards
 */

import { nanoid } from 'nanoid';
import type { Card, Suit, Rank, Deck, DeckConfig, Shoe } from './cardTypes';
import { SUITS, RANKS, CARDS_PER_DECK } from './cardTypes';

/**
 * Creates a single card with the specified properties
 * @param suit The suit of the card
 * @param rank The rank of the card
 * @param faceUp Whether the card is face up
 * @returns A new Card object with a unique ID
 */
export const createCard = (suit: Suit, rank: Rank, faceUp = false): Card => {
    return {
        id: nanoid(),
        suit,
        value: rank,
        faceUp
    };
};

/**
 * Creates a standard deck of 52 cards
 * @param includeIds Whether to include unique IDs for each card
 * @returns Array of Card objects representing a full deck
 */
export const createDeck = (includeIds = true): Card[] => {
    const deck: Card[] = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            const card: Card = {
                id: includeIds ? nanoid() : '',
                suit,
                value: rank,
                faceUp: false
            };

            deck.push(card);
        }
    }

    return deck;
};

/**
 * Creates a full deck object with metadata
 * @returns A Deck object with unique ID and creation timestamp
 */
export const createDeckWithMetadata = (): Deck => {
    return {
        id: nanoid(),
        cards: createDeck(),
        isShuffled: false,
        createdAt: new Date()
    };
};

/**
 * Creates a shoe with multiple decks
 * @param config Configuration for the shoe
 * @returns A Shoe object containing multiple decks
 */
export const createShoe = (config: DeckConfig): Shoe => {
    const { numberOfDecks = 1, customCards = [] } = config;

    // Create the specified number of decks
    const decks: Deck[] = [];
    for (let i = 0; i < numberOfDecks; i++) {
        decks.push(createDeckWithMetadata());
    }

    // Combine all cards from all decks
    let allCards: Card[] = decks.flatMap(deck => deck.cards);

    // Add any custom cards
    if (customCards.length > 0) {
        allCards = [...allCards, ...customCards];
    }

    return {
        id: nanoid(),
        decks,
        cards: allCards,
        remaining: allCards.length,
        penetration: 0.75, // Default penetration (75%)
        cutCardPosition: Math.floor(allCards.length * 0.25), // Default cut card position (25% from bottom)
        isShuffled: false
    };
};

/**
 * Calculates the number of decks remaining in a shoe
 * @param shoe The shoe to calculate from
 * @returns The approximate number of decks remaining
 */
export const getRemainingDecks = (shoe: Shoe): number => {
    return shoe.remaining / CARDS_PER_DECK;
};

/**
 * Gets a human-readable name for a card
 * @param card The card object
 * @returns A human-readable name for the card (e.g., "Ace of Spades")
 */
export const getCardDisplayName = (card: Card): string => {
    const rankNames: Record<Rank, string> = {
        'A': 'Ace',
        '2': 'Two',
        '3': 'Three',
        '4': 'Four',
        '5': 'Five',
        '6': 'Six',
        '7': 'Seven',
        '8': 'Eight',
        '9': 'Nine',
        '10': 'Ten',
        'J': 'Jack',
        'Q': 'Queen',
        'K': 'King'
    };

    const suitNames: Record<Suit, string> = {
        'hearts': 'Hearts',
        'diamonds': 'Diamonds',
        'clubs': 'Clubs',
        'spades': 'Spades'
    };

    return `${rankNames[card.value]} of ${suitNames[card.suit]}`;
};