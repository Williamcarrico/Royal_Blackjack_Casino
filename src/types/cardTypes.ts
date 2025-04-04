/**
 * Card-related type definitions for the blackjack game
 */

// Card suits
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

// Card ranks
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// Card face status
export type CardFace = 'up' | 'down';

// Card color
export type CardColor = 'red' | 'black';

// Card representation
export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    value: number | number[]; // For Ace, it can be 1 or 11
    face: CardFace;
    isFaceUp?: boolean; // Added for compatibility with useDeck hook
}

// Deck of cards
export interface Deck {
    id: string;
    cards: Card[];
    remaining: number;
    isShuffled: boolean;
    createdAt: Date;
}

// Deck configuration
export interface DeckConfig {
    numberOfDecks: number;
    includeJokers: boolean;
    customCards?: Card[];
}

// Shoe containing multiple decks
export interface Shoe {
    id: string;
    decks: Deck[];
    cards: Card[];
    remaining: number;
    penetration: number; // Percentage of cards dealt before reshuffling
    cutCardPosition: number;
    isShuffled: boolean;
}

// Card counting system
export interface CountingSystem {
    name: string;
    values: Record<Rank, number>;
    calculateRunningCount: (cards: Card[]) => number;
    calculateTrueCount: (runningCount: number, decksRemaining: number) => number;
}

// Shuffle methods
export type ShuffleMethod = 'riffle' | 'overhand' | 'strip' | 'fisher-yates';

// Card dealing methods
export type DealMethod = 'faceUp' | 'faceDown' | 'alternating';