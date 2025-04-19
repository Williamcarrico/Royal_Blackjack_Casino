/**
 * Core utility functions for deck operations
 * These are pure functions that handle deck creation, shuffling, and card operations
 */
import { v4 as uuidv4 } from 'uuid';
import {
    Card,
    Deck,
    Shoe,
    Suit,
    Rank,
    DeckConfig,
    ShuffleMethod,
    SUITS,
    RANKS,
    CARD_VALUES
} from '../../domains/card/cardTypes';

/**
 * Create a single deck of cards
 */
export function createDeck(): Deck {
    const cards: Card[] = [];

    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            cards.push({
                id: uuidv4(),
                suit,
                rank,
                value: CARD_VALUES[rank],
                faceUp: false
            });
        });
    });

    return {
        id: uuidv4(),
        cards,
        isShuffled: false,
        createdAt: new Date(),
        remaining: cards.length
    };
}

/**
 * Create multiple decks with configuration
 */
export function createDecks(config: DeckConfig): Deck[] {
    const decks: Deck[] = [];

    for (let i = 0; i < config.numberOfDecks; i++) {
        const deck = createDeck();

        // Add custom cards if specified
        if (config.customCards && config.customCards.length > 0) {
            deck.cards = [...deck.cards, ...config.customCards];
            deck.remaining = deck.cards.length;
        }

        decks.push(deck);
    }

    return decks;
}

/**
 * Create a shoe from multiple decks
 */
export function createShoe(config: DeckConfig): Shoe {
    const decks = createDecks(config);
    const allCards: Card[] = decks.flatMap(deck => deck.cards);

    return {
        id: uuidv4(),
        decks,
        cards: allCards,
        remaining: allCards.length,
        penetration: 0.75, // Default penetration
        cutCardPosition: Math.floor(allCards.length * 0.25), // Default is 25% from the end
        isShuffled: false
    };
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function fisherYatesShuffle(cards: Card[]): Card[] {
    const cardsCopy = [...cards];
    for (let i = cardsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsCopy[i], cardsCopy[j]] = [cardsCopy[j]!, cardsCopy[i]!];
    }
    return cardsCopy;
}

/**
 * Riffle shuffle algorithm
 */
export function riffleShuffle(cards: Card[]): Card[] {
    const cardsCopy = [...cards];
    const mid = Math.floor(cardsCopy.length / 2);
    const firstHalf = cardsCopy.slice(0, mid);
    const secondHalf = cardsCopy.slice(mid);
    const shuffled: Card[] = [];
    const maxOffset = Math.floor(cardsCopy.length * 0.1);

    let i = 0, j = 0;
    while (i < firstHalf.length || j < secondHalf.length) {
        const offset = Math.floor(Math.random() * maxOffset);

        for (let k = 0; k < 1 + offset && i < firstHalf.length; k++, i++) {
            shuffled.push(firstHalf[i]!);
        }

        for (let k = 0; k < 1 + offset && j < secondHalf.length; k++, j++) {
            shuffled.push(secondHalf[j]!);
        }
    }

    return shuffled;
}

/**
 * Overhand shuffle algorithm
 */
export function overhandShuffle(cards: Card[]): Card[] {
    const shuffled: Card[] = [];
    const remainingCards = [...cards];

    while (remainingCards.length > 0) {
        const chunkSize = Math.floor(Math.random() * 10) + 1;
        const chunk = remainingCards.splice(0, Math.min(chunkSize, remainingCards.length));
        shuffled.unshift(...chunk);
    }

    return shuffled;
}

/**
 * Strip shuffle algorithm
 */
export function stripShuffle(cards: Card[]): Card[] {
    const cardsCopy = [...cards];
    const numberOfPiles = Math.floor(Math.random() * 3) + 3;
    const pileSize = Math.floor(cardsCopy.length / numberOfPiles);
    const piles: Card[][] = [];

    for (let i = 0; i < numberOfPiles; i++) {
        const startIdx = i * pileSize;
        const endIdx = (i === numberOfPiles - 1) ? cardsCopy.length : (i + 1) * pileSize;
        piles.push(cardsCopy.slice(startIdx, endIdx));
    }

    for (let i = piles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [piles[i], piles[j]] = [piles[j]!, piles[i]!];
    }

    return piles.flat();
}

/**
 * Shuffle cards using specified method
 */
export function shuffleCards(cards: Card[], method: ShuffleMethod = 'fisher-yates'): Card[] {
    switch (method) {
        case 'fisher-yates':
            return fisherYatesShuffle(cards);
        case 'riffle':
            return riffleShuffle(cards);
        case 'overhand':
            return overhandShuffle(cards);
        case 'strip':
            return stripShuffle(cards);
        default:
            return [...cards];
    }
}

/**
 * Calculate if a shoe needs to be reshuffled based on penetration
 */
export function needsReshuffle(shoe: Shoe, cardsDealt: number): boolean {
    if (!shoe) return false;

    const { cards, penetration } = shoe;
    const totalCards = cards.length;
    const threshold = Math.floor(totalCards * penetration);

    return cardsDealt >= threshold;
}

/**
 * Flip a card to face up or face down
 */
export function flipCard(card: Card, isFaceUp: boolean): Card {
    return {
        ...card,
        faceUp: isFaceUp,
        face: isFaceUp ? 'up' : 'down' // For backward compatibility
    };
}

/**
 * Convert a card to a string representation
 */
export function cardToString(card: Card): string {
    return `${card.rank}${card.suit.charAt(0).toUpperCase()}`;
}

/**
 * Get card image path
 */
export function getCardImagePath(card: Card): string {
    if (!card.faceUp || card.face === 'down') {
        return '/images/cards/back.png';
    }

    const suitName = card.suit.toLowerCase();
    const rankName = card.rank.toLowerCase();

    return `/images/cards/${suitName}_${rankName}.png`;
}