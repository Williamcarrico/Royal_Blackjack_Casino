/**
 * Card helper functions for the blackjack game
 */

import { nanoid } from 'nanoid';
import type { Card, Suit, Rank, CardColor } from '@/types/card';
import type { Hand } from '@/types/gameTypes';
import { CARD_VALUES, SUIT_COLORS, CARDS_PER_DECK } from '@/lib/constants/gameConstants';

/**
 * Creates a deck of cards
 * @param includeIds Whether to include unique IDs for each card
 * @returns Array of Card objects
 */
export const createDeck = (includeIds = true): Card[] => {
    const deck: Card[] = [];
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    for (const suit of suits) {
        for (const rank of ranks) {
            const card: Card = {
                suit,
                value: rank,
                faceUp: false
            };

            if (includeIds) {
                card.id = nanoid();
            }

            deck.push(card);
        }
    }

    return deck;
};

/**
 * Creates a shoe with multiple decks
 * @param numDecks Number of decks to include in the shoe
 * @param includeIds Whether to include unique IDs for each card
 * @returns Array of Card objects
 */
export const createShoe = (numDecks: number, includeIds = true): Card[] => {
    const shoe: Card[] = [];

    for (let i = 0; i < numDecks; i++) {
        const deck = createDeck(includeIds);
        shoe.push(...deck);
    }

    return shoe;
};

/**
 * Shuffles an array of cards
 * @param cards Array of cards to shuffle
 * @returns Shuffled array of cards
 */
export const shuffleCards = <T extends Card>(cards: T[]): T[] => {
    const shuffled = [...cards];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

/**
 * Gets the color of a card based on its suit
 * @param card The card object or suit
 * @returns The color of the card ('red' or 'black')
 */
export const getCardColor = (card: Card | Suit): CardColor => {
    const suit = typeof card === 'string' ? card : card.suit;
    return SUIT_COLORS[suit];
};

/**
 * Gets the numeric value(s) of a card for blackjack
 * @param card The card object or rank
 * @returns Array of possible values for the card
 */
export const getCardValues = (card: Card | Rank): number[] => {
    const rank = typeof card === 'string' ? card : card.value;
    return CARD_VALUES[rank];
};

/**
 * Gets the best (highest non-busting) value of a card
 * @param card The card to evaluate
 * @param currentTotal Current total of the hand
 * @returns The best value for the card in the current context
 */
export const getBestCardValue = (card: Card, currentTotal = 0): number => {
    const values = getCardValues(card);

    // If there's only one value, return it
    if (values.length === 1) return values[0];

    // For cards with multiple values (i.e., Aces)
    // Choose the highest value that doesn't cause a bust
    for (let i = values.length - 1; i >= 0; i--) {
        if (currentTotal + values[i] <= 21) {
            return values[i];
        }
    }

    // If all values cause a bust, return the lowest
    return values[0];
};

/**
 * Creates a card with the specified properties
 * @param suit The suit of the card
 * @param rank The rank of the card
 * @param faceUp Whether the card is face up
 * @returns A new Card object
 */
export const createCard = (suit: Suit, rank: Rank, faceUp = false): Card => {
    return {
        suit,
        value: rank,
        faceUp,
        id: nanoid()
    };
};

/**
 * Calculates the remaining number of decks in a shoe
 * @param shoe The current shoe
 * @returns The number of decks remaining (may be fractional)
 */
export const getRemainingDecks = (shoe: Card[]): number => {
    return shoe.length / CARDS_PER_DECK;
};

/**
 * Gets a display name for a card
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
 * Checks if cards make a pair (same rank)
 * @param card1 First card
 * @param card2 Second card
 * @returns Whether the cards form a pair
 */
export const isPair = (card1: Card, card2: Card): boolean => {
    return card1.value === card2.value;
};

/**
 * Checks if cards make a suited pair (same rank and suit)
 * @param card1 First card
 * @param card2 Second card
 * @returns Whether the cards form a suited pair
 */
export const isSuitedPair = (card1: Card, card2: Card): boolean => {
    return isPair(card1, card2) && card1.suit === card2.suit;
};

/**
 * Checks if a card is a face card (Jack, Queen, or King)
 * @param card The card to check
 * @returns Whether the card is a face card
 */
export const isFaceCard = (card: Card): boolean => {
    return ['J', 'Q', 'K'].includes(card.value);
};

/**
 * Generates a key for a card that can be used in React lists
 * @param card The card
 * @returns A unique key for the card
 */
export const getCardKey = (card: Card): string => {
    if (card.id) return card.id;
    return `${card.value}-${card.suit}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Deals a card from the shoe
 * @param shoe The current shoe of cards
 * @param faceUp Whether the card should be face up
 * @returns An object containing the dealt card and the updated shoe
 */
export const dealCard = (shoe: Card[], faceUp = true): { card: Card; updatedShoe: Card[] } => {
    if (shoe.length === 0) {
        throw new Error('No cards left in shoe');
    }

    const updatedShoe = [...shoe];
    const card = { ...updatedShoe.pop()! };

    // Set face up state and ensure it has an ID
    card.faceUp = faceUp;
    if (!card.id) {
        card.id = nanoid();
    }

    return { card, updatedShoe };
};

/**
 * Checks if a hand is a blackjack (21 with exactly 2 cards)
 * @param cards The cards in the hand
 * @returns Whether the hand is a blackjack
 */
export const isBlackjack = (cards: Card[]): boolean => {
    // Blackjack requires exactly 2 cards
    if (cards.length !== 2) return false;

    // Calculate the hand value
    const values = calculateHandValues(cards);

    // Check if any of the possible values is 21
    return values.includes(21);
};

/**
 * Checks if a hand can be split
 * @param cards The cards in the hand
 * @returns Whether the hand can be split
 */
export const canSplit = (cards: Card[]): boolean => {
    // Can only split with exactly 2 cards
    if (cards.length !== 2) return false;

    // Cards must have the same rank
    return cards[0].value === cards[1].value;
};

/**
 * Calculates all possible values of a hand
 * @param cards The cards in the hand
 * @returns Array of possible hand values
 */
export const calculateHandValues = (cards: Card[]): number[] => {
    // Start with a single value of 0
    let values: number[] = [0];

    // Handle each card
    for (const card of cards) {
        const cardValues = getCardValues(card);

        // For each existing value, create new ones with each card value
        const newValues: number[] = [];

        for (const existingValue of values) {
            for (const cardValue of cardValues) {
                newValues.push(existingValue + cardValue);
            }
        }

        values = newValues;
    }

    return values;
};

/**
 * Gets the best (highest non-busting) value of a hand
 * @param cards The cards in the hand
 * @returns The best hand value (0 if all values bust)
 */
export const getBestHandValue = (cards: Card[]): number => {
    const values = calculateHandValues(cards);

    // Filter values that don't bust
    const nonBustValues = values.filter(v => v <= 21);

    if (nonBustValues.length > 0) {
        // Return the highest non-busting value
        return Math.max(...nonBustValues);
    } else {
        // All values bust, return the lowest busting value
        return Math.min(...values);
    }
};

/**
 * Sorts cards in a hand
 * @param cards The cards to sort
 * @param sortBy The property to sort by ('rank' or 'suit')
 * @returns Sorted array of cards
 */
export const sortCards = <T extends Card>(cards: T[], sortBy: 'rank' | 'suit' = 'rank'): T[] => {
    return [...cards].sort((a, b) => {
        if (sortBy === 'rank') {
            // Create a rank order map (A is high)
            const rankOrder: Record<Rank, number> = {
                '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
                'J': 11, 'Q': 12, 'K': 13, 'A': 14
            };

            return rankOrder[a.value] - rankOrder[b.value];
        } else {
            // Sort by suit (hearts, diamonds, clubs, spades)
            const suitOrder: Record<Suit, number> = {
                'hearts': 1, 'diamonds': 2, 'clubs': 3, 'spades': 4
            };

            return suitOrder[a.suit] - suitOrder[b.suit];
        }
    });
};

/**
 * Gets a description of a hand (e.g., "Soft 17", "Hard 15")
 * @param cards The cards in the hand
 * @returns String description of the hand
 */
export const getHandDescription = (cards: Card[]): string => {
    const values = calculateHandValues(cards);

    // Filter values that don't bust
    const nonBustValues = values.filter(v => v <= 21);

    if (nonBustValues.length === 0) {
        return 'Bust';
    }

    // Check if the hand is a blackjack
    if (isBlackjack(cards)) {
        return 'Blackjack';
    }

    // Get the best hand value
    const bestValue = Math.max(...nonBustValues);

    // Check if the hand has multiple values (soft hand)
    const isSoft = nonBustValues.length > 1 && cards.some(card => card.value === 'A');

    if (isSoft) {
        return `Soft ${bestValue}`;
    } else {
        return `Hard ${bestValue}`;
    }
};

/**
 * Checks if a hand is busted (all values over 21)
 * @param cards The cards in the hand
 * @returns Whether the hand is busted
 */
export const isBust = (cards: Card[]): boolean => {
    const values = calculateHandValues(cards);
    return values.every(value => value > 21);
};

/**
 * Checks if the dealer's up card is an Ace
 * @param dealerCards The dealer's cards
 * @returns Whether the dealer's up card is an Ace
 */
export const isDealerShowingAce = (dealerCards: Card[]): boolean => {
    if (dealerCards.length === 0) return false;

    // Find the first face-up card
    const upCard = dealerCards.find(card => card.faceUp);
    return upCard?.value === 'A';
};

/**
 * Compares two hands to determine the winner
 * @param playerHand The player's hand
 * @param dealerHand The dealer's hand
 * @returns 1 if player wins, -1 if dealer wins, 0 if push
 */
export const compareHands = (playerHand: Card[], dealerHand: Card[]): number => {
    // Check for blackjacks
    const playerHasBlackjack = isBlackjack(playerHand);
    const dealerHasBlackjack = isBlackjack(dealerHand);

    // If both have blackjack, it's a push
    if (playerHasBlackjack && dealerHasBlackjack) {
        return 0;
    }

    // If player has blackjack, player wins
    if (playerHasBlackjack) {
        return 1;
    }

    // If dealer has blackjack, dealer wins
    if (dealerHasBlackjack) {
        return -1;
    }

    // Check for busts
    const playerIsBust = isBust(playerHand);
    const dealerIsBust = isBust(dealerHand);

    // If player busts, dealer wins
    if (playerIsBust) {
        return -1;
    }

    // If dealer busts, player wins
    if (dealerIsBust) {
        return 1;
    }

    // Compare hand values
    const playerValue = getBestHandValue(playerHand);
    const dealerValue = getBestHandValue(dealerHand);

    if (playerValue > dealerValue) {
        return 1; // Player wins
    } else if (dealerValue > playerValue) {
        return -1; // Dealer wins
    } else {
        return 0; // Push
    }
};

/**
 * Checks if two cards are of consecutive rank
 * @param card1 First card
 * @param card2 Second card
 * @returns Whether the cards are of consecutive rank
 */
export const isConsecutiveRank = (card1: Card, card2: Card): boolean => {
    // Create a rank order array
    const rankOrder: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    const index1 = rankOrder.indexOf(card1.value);
    const index2 = rankOrder.indexOf(card2.value);

    return Math.abs(index1 - index2) === 1;
};

/**
 * Checks if all cards in a hand are of the same suit
 * @param cards The cards to check
 * @returns Whether all cards are of the same suit
 */
export const isSameSuit = (cards: Card[]): boolean => {
    if (cards.length === 0) return false;

    const firstSuit = cards[0].suit;
    return cards.every(card => card.suit === firstSuit);
};

/**
 * Converts a card to an image path for rendering
 * @param card The card to convert
 * @param style The card style ('modern', 'classic', etc.)
 * @returns The image path for the card
 */
export const cardToImagePath = (card: Card, style = 'modern'): string => {
    if (!card.faceUp) {
        return `/images/cards/${style}/back.png`;
    }

    const rankMap: Record<Rank, string> = {
        'A': 'ace',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'nine',
        '10': 'ten',
        'J': 'jack',
        'Q': 'queen',
        'K': 'king'
    };

    return `/images/cards/${style}/${rankMap[card.value]}_of_${card.suit}.png`;
};

/**
 * Creates a hand object from an array of cards
 * @param cards The cards in the hand
 * @param id Optional ID for the hand
 * @returns A Hand object
 */
export const createHand = (cards: Card[], id?: string): Hand => {
    const handId = id || nanoid();
    const values = calculateHandValues(cards);

    return {
        id: handId,
        cards: cards.map(card => card.id || nanoid()),
        values,
        isBlackjack: isBlackjack(cards),
        isBusted: isBust(cards),
        isSoft: values.length > 1 && cards.some(card => card.value === 'A'),
        canSplit: canSplit(cards),
    };
};

/**
 * Converts a normalized hand with card IDs to an array of card objects
 * @param hand The normalized hand with card IDs
 * @param cardMap A map of card IDs to card objects
 * @returns Array of card objects
 */
export const getCardsFromHand = (hand: Hand, cardMap: Record<string, Card>): Card[] => {
    return hand.cards
        .map(cardId => cardMap[cardId])
        .filter(Boolean);
};

/**
 * Determines if a hand is soft (contains an Ace counted as 11)
 * @param cards The cards to check
 * @returns Whether the hand is soft
 */
export const isSoftHand = (cards: Card[]): boolean => {
    // A hand is soft if it contains an Ace AND has multiple values
    const values = calculateHandValues(cards);
    const hasAce = cards.some(card => card.value === 'A');

    return hasAce && values.length > 1;
};

/**
 * Gets all possible 21+3 poker hand combinations from player and dealer cards
 * @param playerCards The player's cards (first two)
 * @param dealerUpCard The dealer's up card
 * @returns Array of all valid poker hands
 */
export const getThreeCardPokerHands = (playerCards: Card[], dealerUpCard: Card): { type: string; cards: Card[] }[] => {
    // Need 2 player cards and 1 dealer card
    if (playerCards.length < 2 || !dealerUpCard) {
        return [];
    }

    const threeCards = [playerCards[0], playerCards[1], dealerUpCard];

    // Check for three of a kind
    if (threeCards[0].value === threeCards[1].value &&
        threeCards[1].value === threeCards[2].value) {
        return [{ type: 'threeOfAKind', cards: threeCards }];
    }

    // Check for straight flush
    const isStraight = (
        isConsecutiveRank(threeCards[0], threeCards[1]) &&
        isConsecutiveRank(threeCards[1], threeCards[2])
    ) || (
            // Special case: A-2-3
            threeCards.some(c => c.value === 'A') &&
            threeCards.some(c => c.value === '2') &&
            threeCards.some(c => c.value === '3')
        );

    const isFlush = isSameSuit(threeCards);

    if (isStraight && isFlush) {
        return [{ type: 'straightFlush', cards: threeCards }];
    }

    if (isStraight) {
        return [{ type: 'straight', cards: threeCards }];
    }

    if (isFlush) {
        return [{ type: 'flush', cards: threeCards }];
    }

    // Check for pair
    if (threeCards[0].value === threeCards[1].value ||
        threeCards[1].value === threeCards[2].value ||
        threeCards[0].value === threeCards[2].value) {
        return [{ type: 'pair', cards: threeCards }];
    }

    return [];
};