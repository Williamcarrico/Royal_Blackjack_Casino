/**
 * Card domain model types for Royal Blackjack Casino
 */

import { CardID, DeckID } from '../branded';

/**
 * Card suit enum
 */
export enum CardSuit {
    HEARTS = 'hearts',
    DIAMONDS = 'diamonds',
    CLUBS = 'clubs',
    SPADES = 'spades'
}

/**
 * Card rank enum
 */
export enum CardRank {
    ACE = 'A',
    TWO = '2',
    THREE = '3',
    FOUR = '4',
    FIVE = '5',
    SIX = '6',
    SEVEN = '7',
    EIGHT = '8',
    NINE = '9',
    TEN = '10',
    JACK = 'J',
    QUEEN = 'Q',
    KING = 'K'
}

/**
 * Card color enum
 */
export enum CardColor {
    RED = 'red',
    BLACK = 'black'
}

/**
 * Card interface
 */
export interface Card {
    id: CardID;
    suit: CardSuit;
    rank: CardRank;
    value: number | number[];
    color: CardColor;
    faceUp: boolean;
    deckId: DeckID;
    imageUrl?: string;
}

/**
 * Deck interface
 */
export interface Deck {
    id: DeckID;
    cards: Card[];
    isShuffled: boolean;
    lastShuffled?: Date;
    remainingCards: number;
}

/**
 * Shoe interface (multiple decks)
 */
export interface Shoe {
    decks: Deck[];
    cards: Card[];
    remainingCards: number;
    penetration: number;
    needsShuffle: boolean;
}

/**
 * Card back design options
 */
export enum CardBackDesign {
    BLUE = 'blue',
    RED = 'red',
    ABSTRACT = 'abstract',
    ABSTRACT_SCENE = 'abstract_scene',
    ABSTRACT_CLOUDS = 'abstract_clouds',
    ASTRONAUT = 'astronaut',
    CARS = 'cars',
    CASTLE = 'castle',
    FISH = 'fish',
    FROG = 'frog'
}