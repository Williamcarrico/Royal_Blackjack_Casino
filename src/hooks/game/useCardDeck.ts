/**
 * Hook for managing card deck operations in Blackjack
 */
import { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Card,
    Deck,
    Shoe,
    Suit,
    Rank,
    DeckConfig,
    ShuffleMethod
} from '../../types/cardTypes';
import createDeckSlice from '../../store/slices/deckSlice';
import { create } from 'zustand';

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

// Deck slice
const useDeckStore = create(createDeckSlice);

/**
 * Hook for managing card decks and operations
 */
export function useCardDeck() {
    const { shoe, isShuffling, cardsDealt, createShoe, shuffleShoe, dealCard, resetShoe } = useDeckStore();

    /**
     * Create a single deck of cards
     */
    const createDeck = useCallback((): Deck => {
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
    }, []);

    /**
     * Create multiple decks with configuration
     */
    const createDecks = useCallback((config: DeckConfig): Deck[] => {
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
    }, [createDeck]);

    /**
     * Create a shoe of multiple decks
     */
    const initializeShoe = useCallback((numberOfDecks: number = 6, penetration: number = 0.75): Shoe => {
        createShoe(numberOfDecks);

        if (!shoe) {
            throw new Error('Failed to create shoe');
        }

        // Pass penetration to the store or create a new shoe with the penetration value
        if (shoe && shoe.penetration !== penetration) {
            // Update penetration in the store if needed
            // This would require an additional store action to be implemented
        }

        return shoe;
    }, [createShoe, shoe]);

    /**
     * Perform Fisher-Yates shuffle
     */
    const fisherYatesShuffle = useCallback((cards: Card[]): Card[] => {
        const cardsCopy = [...cards];
        for (let i = cardsCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardsCopy[i], cardsCopy[j]] = [cardsCopy[j]!, cardsCopy[i]!];
        }
        return cardsCopy;
    }, []);

    /**
     * Perform riffle shuffle
     */
    const riffleShuffle = useCallback((cards: Card[]): Card[] => {
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
    }, []);

    /**
     * Perform overhand shuffle
     */
    const overhandShuffle = useCallback((cards: Card[]): Card[] => {
        const shuffled: Card[] = [];
        const remainingCards = [...cards];

        while (remainingCards.length > 0) {
            const chunkSize = Math.floor(Math.random() * 10) + 1;
            const chunk = remainingCards.splice(0, Math.min(chunkSize, remainingCards.length));
            shuffled.unshift(...chunk);
        }

        return shuffled;
    }, []);

    /**
     * Perform strip shuffle
     */
    const stripShuffle = useCallback((cards: Card[]): Card[] => {
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
    }, []);

    /**
     * Shuffle cards using different methods
     */
    const shuffleCards = useCallback((cards: Card[], method: ShuffleMethod = 'fisher-yates'): Card[] => {
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
    }, [fisherYatesShuffle, riffleShuffle, overhandShuffle, stripShuffle]);

    /**
     * Shuffle the current shoe
     */
    const shuffle = useCallback(() => {
        shuffleShoe();
    }, [shuffleShoe]);

    /**
     * Deal a card from the shoe
     */
    const deal = useCallback((faceUp: boolean = true): Card => {
        try {
            return dealCard(faceUp);
        } catch (error) {
            throw new Error(`Failed to deal card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [dealCard]);

    /**
     * Deal multiple cards at once
     */
    const dealMultiple = useCallback((count: number, faceUp: boolean = true): Card[] => {
        const cards: Card[] = [];

        try {
            for (let i = 0; i < count; i++) {
                cards.push(deal(faceUp));
            }

            return cards;
        } catch (error) {
            throw new Error(`Failed to deal multiple cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [deal]);

    /**
     * Reset the shoe to initial state
     */
    const reset = useCallback(() => {
        resetShoe();
    }, [resetShoe]);

    /**
     * Check if the shoe needs to be reshuffled (penetration reached)
     */
    const needsReshuffle = useMemo((): boolean => {
        if (!shoe) return false;

        const { cards, penetration } = shoe;
        const totalCards = cards.length;
        const threshold = Math.floor(totalCards * penetration);

        return cardsDealt >= threshold;
    }, [shoe, cardsDealt]);

    /**
     * Get remaining cards count
     */
    const remainingCards = useMemo((): number => {
        if (!shoe) return 0;

        return shoe.cards.length - cardsDealt;
    }, [shoe, cardsDealt]);

    /**
     * Get cards dealt so far
     */
    const dealtCards = useMemo((): Card[] => {
        if (!shoe) return [];

        return shoe.cards.slice(0, cardsDealt);
    }, [shoe, cardsDealt]);

    /**
     * Get estimated number of decks remaining
     */
    const decksRemaining = useMemo((): number => {
        if (!shoe) return 0;

        const cardsPerDeck = 52;
        return remainingCards / cardsPerDeck;
    }, [remainingCards, shoe]);

    /**
     * Convert a card to a string representation
     */
    const cardToString = useCallback((card: Card): string => {
        return `${card.rank}${card.suit.charAt(0).toUpperCase()}`;
    }, []);

    /**
     * Get card image path
     */
    const getCardImagePath = useCallback((card: Card): string => {
        if (card.face === 'down') {
            return '/images/cards/back.png';
        }

        const suitName = card.suit.toLowerCase();
        const rankName = card.rank.toLowerCase();

        return `/images/cards/${suitName}_${rankName}.png`;
    }, []);

    return {
        // State
        shoe,
        isShuffling,
        cardsDealt,
        dealtCards,
        remainingCards,
        decksRemaining,
        needsReshuffle,

        // Actions
        createDeck,
        createDecks,
        initializeShoe,
        shuffleCards,
        shuffle,
        deal,
        dealMultiple,
        reset,

        // Helpers
        cardToString,
        getCardImagePath
    };
}

export default useCardDeck;