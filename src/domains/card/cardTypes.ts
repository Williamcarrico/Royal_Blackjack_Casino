/**
 * Card domain type definitions
 * Compatible with existing card components and helper functions
 */

// Card suits
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

// Card ranks
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card colors
export type CardColor = 'red' | 'black';
export const SUIT_COLORS: Record<Suit, CardColor> = {
    'hearts': 'red',
    'diamonds': 'red',
    'clubs': 'black',
    'spades': 'black'
};

// Card values (for Blackjack)
export const CARD_VALUES: Record<Rank, number[]> = {
    'A': [1, 11],
    '2': [2],
    '3': [3],
    '4': [4],
    '5': [5],
    '6': [6],
    '7': [7],
    '8': [8],
    '9': [9],
    '10': [10],
    'J': [10],
    'Q': [10],
    'K': [10]
};

// Game constants
export const CARDS_PER_DECK = 52;

/**
 * Represents a playing card
 */
export interface Card {
    id: string;        // Unique identifier for the card
    suit: Suit;        // Card suit
    value: Rank;       // Card rank
    faceUp: boolean;   // Whether the card is face up or down
}

/**
 * Represents a deck of cards
 */
export interface Deck {
    id: string;              // Unique identifier for the deck
    cards: Card[];           // Cards in the deck
    isShuffled: boolean;     // Whether the deck has been shuffled
    createdAt: Date;         // When the deck was created
}

/**
 * Configuration for creating decks
 */
export interface DeckConfig {
    numberOfDecks: number;   // Number of decks to use
    includeJokers: boolean;  // Whether to include jokers
    customCards?: Card[];    // Any custom cards to add
}

/**
 * Represents a shoe (multiple decks)
 */
export interface Shoe {
    id: string;              // Unique identifier for the shoe
    decks: Deck[];           // Decks in the shoe
    cards: Card[];           // All cards in the shoe
    remaining: number;       // Number of cards remaining
    penetration: number;     // Percentage of cards dealt before reshuffling
    cutCardPosition: number; // Position of the cut card
    isShuffled: boolean;     // Whether the shoe has been shuffled
}