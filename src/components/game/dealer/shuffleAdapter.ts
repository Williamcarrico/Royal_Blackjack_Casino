/**
 * Card shuffling adapter
 * Provides card-specific shuffling methods using the generic shuffle utilities
 */

import type { Card, Deck, Shoe, ShuffleMethod } from './cardTypes';
import {
    shuffle,
    shuffleInPlace,
    cutArray,
    overhandShuffle,
    riffleShuffle
} from '@/lib/utils/shuffle';

/**
 * Shuffles a deck of cards without modifying the original
 *
 * @param deck The deck to shuffle
 * @param seed Optional seed for reproducible shuffling
 * @returns A new shuffled deck
 */
export const shuffleDeck = (deck: Card[], seed?: number): Card[] => {
    return shuffle(deck, seed);
};

/**
 * Shuffles a Deck object
 *
 * @param deck The Deck object to shuffle
 * @param seed Optional seed for reproducible shuffling
 * @returns A new Deck object with shuffled cards and updated metadata
 */
export const shuffleDeckObject = (deck: Deck, seed?: number): Deck => {
    return {
        ...deck,
        cards: shuffleDeck(deck.cards, seed),
        isShuffled: true
    };
};

/**
 * Shuffles a Shoe object
 *
 * @param shoe The Shoe object to shuffle
 * @param method Shuffle method to use
 * @param seed Optional seed for reproducible shuffling
 * @returns A new Shoe object with shuffled cards
 */
export const shuffleShoe = (
    shoe: Shoe,
    method: ShuffleMethod = 'fisher-yates',
    seed?: number
): Shoe => {
    // Choose the shuffle method
    let shuffledCards: Card[];

    switch (method) {
        case 'riffle':
            shuffledCards = riffleShuffle(shoe.cards, 3, seed);
            break;
        case 'overhand':
            shuffledCards = overhandShuffle(shoe.cards, 3, seed);
            break;
        case 'strip':
            // Strip cut is essentially multiple cuts
            shuffledCards = [...shoe.cards];
            // Perform 3-5 cuts
            const cuts = seed ?
                (seed % 3) + 3 : // Deterministic number of cuts if seed provided
                Math.floor(Math.random() * 3) + 3; // Random number of cuts

            for (let i = 0; i < cuts; i++) {
                shuffledCards = cutArray(shuffledCards, undefined, seed ? seed + i : undefined);
            }
            break;
        case 'fisher-yates':
        default:
            shuffledCards = shuffle(shoe.cards, seed);
    }

    return {
        ...shoe,
        cards: shuffledCards,
        isShuffled: true
    };
};

/**
 * Performs a cut on a deck of cards
 *
 * @param deck The deck to cut
 * @param cutPosition The position to cut at (defaults to random)
 * @param seed Optional seed for reproducible cutting
 * @returns A new deck that's been cut
 */
export const cutDeck = (deck: Card[], cutPosition?: number, seed?: number): Card[] => {
    return cutArray(deck, cutPosition, seed);
};

/**
 * Places a cut card in the deck at a specific position
 *
 * @param shoe The shoe to place the cut card in
 * @param penetration How far through the deck to place the cut card (0-1)
 * @returns The updated shoe with the cut card position set
 */
export const placeCutCard = (shoe: Shoe, penetration = 0.75): Shoe => {
    // Calculate the position as cards from the bottom
    const position = Math.floor(shoe.cards.length * (1 - penetration));

    return {
        ...shoe,
        penetration,
        cutCardPosition: position
    };
};