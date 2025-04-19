/**
 * Card factory functions for creating and managing cards
 * Single source of truth for card creation and manipulation
 */

import { nanoid } from 'nanoid';
import type { Card, Suit, Rank, Deck, DeckConfig, Shoe, CardFace } from './cardTypes';
import { SUITS, RANKS, CARDS_PER_DECK, CARD_VALUES } from './cardTypes';

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
        faceUp,
        face: faceUp ? 'up' : 'down'
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
                faceUp: false,
                face: 'down'
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
    const cards = createDeck();
    return {
        id: nanoid(),
        cards,
        remaining: cards.length,
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
    const { numberOfDecks = 1, customCards = [], includeJokers = false } = config;

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

    // Default penetration (75%)
    const penetration = 0.75;

    return {
        id: nanoid(),
        decks,
        cards: allCards,
        remaining: allCards.length,
        penetration,
        cutCardPosition: Math.floor(allCards.length * (1 - penetration)), // Cut card at 25% from bottom
        isShuffled: false
    };
};

/**
 * Shuffles cards using the Fisher-Yates algorithm
 * @param cards The cards to shuffle
 * @returns A new array with shuffled cards
 */
export const shuffleCards = <T>(cards: T[]): T[] => {
    const shuffled = [...cards];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
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

/**
 * Gets the value of a card for scoring in blackjack
 * @param card The card to get the value for
 * @returns An array of possible values for the card
 */
export const getCardValue = (card: Card): number[] => {
    return CARD_VALUES[card.value];
};

/**
 * Flips a card to face up or face down
 * @param card The card to flip
 * @param faceUp Whether the card should be face up
 * @returns A new card with the updated face status
 */
export const flipCard = (card: Card, faceUp: boolean): Card => {
    return {
        ...card,
        faceUp,
        face: faceUp ? 'up' : 'down'
    };
};