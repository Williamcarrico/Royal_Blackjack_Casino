/**
 * Card shuffling algorithms and related utilities
 */

import type { Card, Deck, Shoe } from './cardTypes';

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * This modifies the original array
 *
 * @param array The array to shuffle
 * @returns The shuffled array (same reference)
 */
export const shuffleInPlace = <T>(array: T[]): T[] => {
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j]!, array[i]!];
    }

    return array;
};

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * Creates a new copy without modifying the original
 *
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export const shuffle = <T>(array: T[]): T[] => {
    const newArray = [...array];
    return shuffleInPlace(newArray);
};

/**
 * Shuffles a deck of cards without modifying the original
 *
 * @param deck The deck to shuffle
 * @returns A new shuffled deck
 */
export const shuffleDeck = (deck: Card[]): Card[] => {
    return shuffle(deck);
};

/**
 * Shuffles a Deck object
 *
 * @param deck The Deck object to shuffle
 * @returns A new Deck object with shuffled cards and updated metadata
 */
export const shuffleDeckObject = (deck: Deck): Deck => {
    return {
        ...deck,
        cards: shuffleDeck(deck.cards),
        isShuffled: true
    };
};

/**
 * Shuffles a Shoe object
 *
 * @param shoe The Shoe object to shuffle
 * @returns A new Shoe object with shuffled cards
 */
export const shuffleShoe = (shoe: Shoe): Shoe => {
    // Shuffle the combined cards
    const shuffledCards = shuffle(shoe.cards);

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
 * @returns A new deck that's been cut
 */
export const cutDeck = (deck: Card[], cutPosition?: number): Card[] => {
    if (deck.length <= 1) {
        return [...deck];
    }

    // If no cut position specified, choose a random position
    // that's not too close to either end
    const actualCutPosition = cutPosition ?? Math.floor(deck.length * 0.3 + Math.random() * deck.length * 0.4);

    // Make sure the cut position is valid
    const validCutPosition = Math.max(1, Math.min(actualCutPosition, deck.length - 1));

    // Cut the deck
    const topHalf = deck.slice(0, validCutPosition);
    const bottomHalf = deck.slice(validCutPosition);

    // Return bottom half followed by top half
    return [...bottomHalf, ...topHalf];
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

/**
 * Overhand shuffle simulation - less random than Fisher-Yates but mimics real shuffling
 *
 * @param cards The cards to shuffle
 * @param iterations How many times to perform the shuffle
 * @returns A new array of shuffled cards
 */
export const overhandShuffle = <T>(cards: T[], iterations = 3): T[] => {
    let result = [...cards];

    for (let iter = 0; iter < iterations; iter++) {
        const shuffled: T[] = [];
        const remainingCards = [...result];

        // Continue until we've moved all cards
        while (remainingCards.length > 0) {
            // Take a random small packet of cards from the top
            const packetSize = Math.max(1, Math.floor(Math.random() * remainingCards.length * 0.4));
            const packet = remainingCards.splice(0, packetSize);

            // Add the packet to the beginning of the shuffled pile
            shuffled.unshift(...packet);
        }

        result = shuffled;
    }

    return result;
};

/**
 * Takes cards from a pile, handling "sticky" cards that might come together
 */
const takeCardsFromPile = <T>(pile: T[], index: number): { cards: T[], advanceBy: number } => {
    // Sometimes cards might stick together
    const stickTogether = Math.random() < 0.1;
    const stickyCount = stickTogether ? 1 + Math.floor(Math.random() * 3) : 1;

    // Take up to stickyCount cards, but don't exceed pile length
    const count = Math.min(stickyCount, pile.length - index);
    const cards = pile.slice(index, index + count);

    return { cards, advanceBy: count };
};

/**
 * Interleaves cards from left and right piles
 */
const interleaveCards = <T>(left: T[], right: T[]): T[] => {
    const result: T[] = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length || rightIndex < right.length) {
        // Determine which pile to process first
        const processLeftFirst = Math.random() > 0.5;

        if (processLeftFirst && leftIndex < left.length) {
            // Process left pile
            const { cards, advanceBy } = takeCardsFromPile(left, leftIndex);
            result.push(...cards);
            leftIndex += advanceBy;

            // Process right pile (single card)
            if (rightIndex < right.length) {
                result.push(right[rightIndex]!);
                rightIndex++;
            }
        } else if (rightIndex < right.length) {
            // Process right pile
            const { cards, advanceBy } = takeCardsFromPile(right, rightIndex);
            result.push(...cards);
            rightIndex += advanceBy;

            // Process left pile (single card)
            if (leftIndex < left.length) {
                result.push(left[leftIndex]!);
                leftIndex++;
            }
        }
    }

    return result;
};

/**
 * Riffle shuffle simulation - alternates cards from two halves
 *
 * @param cards The cards to shuffle
 * @param iterations How many times to perform the shuffle
 * @returns A new array of shuffled cards
 */
export const riffleShuffle = <T>(cards: T[], iterations = 3): T[] => {
    let result = [...cards];

    for (let iter = 0; iter < iterations; iter++) {
        // Split the deck into two halves
        const mid = Math.floor(result.length / 2);
        const left = result.slice(0, mid);
        const right = result.slice(mid);

        // Interleave the cards
        result = interleaveCards(left, right);
    }

    return result;
};