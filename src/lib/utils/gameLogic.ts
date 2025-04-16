/**
 * Core game logic for the blackjack game
 */

import { nanoid } from 'nanoid';
import type { Card, Hand, RoundResult, GameRules } from '@/types/gameTypes';
import type { Suit, Rank } from '@/types/card';
import { CARD_VALUES, SUIT_COLORS } from '@/lib/constants/gameConstants';

/**
 * Default Vegas rules for blackjack
 */
export const VEGAS_RULES = {
    decksCount: 6,
    dealerHitsSoft17: true,
    blackjackPays: 1.5,
    doubleAllowed: true,
    doubleAfterSplit: true,
    surrender: false,
    insuranceAvailable: true,
    maxSplits: 4,
    resplitAces: false,
    hitSplitAces: false,
    minimumBet: 5,
    maximumBet: 1000
};

/**
 * Creates a deck of cards
 *
 * @returns Array of Card objects
 */
export const createDeck = (): Card[] => {
    const deck: Card[] = [];
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    for (const suit of suits) {
        for (const rank of ranks) {
            // Create a card of each suit and rank
            const card: Card = {
                id: nanoid(),
                suit,
                rank,
                // Get the first (lowest) value for the rank
                value: CARD_VALUES[rank][0],
                isFaceUp: false,
            };

            deck.push(card);
        }
    }

    return deck;
};

/**
 * Creates a shoe with multiple decks
 *
 * @param numDecks Number of decks to use
 * @returns Array of Card objects
 */
export const createShoe = (numDecks: number): Card[] => {
    let shoe: Card[] = [];

    // Create the specified number of decks
    for (let i = 0; i < numDecks; i++) {
        const deck = createDeck();
        shoe = [...shoe, ...deck];
    }

    // Shuffle the shoe
    return shuffleCards(shoe);
};

/**
 * Shuffles an array of cards using the Fisher-Yates algorithm
 *
 * @param cards Array of cards to shuffle
 * @returns Shuffled array of cards
 */
export const shuffleCards = <T>(cards: T[]): T[] => {
    const shuffled = [...cards];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

/**
 * Calculates all possible values of a hand
 *
 * @param cards Array of cards in the hand
 * @returns Array of possible hand values
 */
export const calculateHandValues = (cards: Card[]): number[] => {
    // Start with a single value of 0
    let values: number[] = [0];

    // Process each card
    for (const card of cards) {
        // Skip face-down cards
        if (!card.isFaceUp) continue;

        // Get all possible values for this card
        let cardValues: number[];
        if (card.rank === 'A') {
            cardValues = [1, 11]; // Aces can be 1 or 11
        } else if (['J', 'Q', 'K'].includes(card.rank)) {
            cardValues = [10]; // Face cards are worth 10
        } else {
            cardValues = [parseInt(card.rank)]; // Number cards are worth their number
        }

        // Calculate new hand values with all possible card values
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
 *
 * @param values Array of possible hand values
 * @returns The best value for the hand (0 if all values bust)
 */
export const getBestHandValue = (values: number[]): number => {
    // Filter out busting values
    const nonBustValues = values.filter(value => value <= 21);

    if (nonBustValues.length > 0) {
        // Return the highest non-busting value
        return Math.max(...nonBustValues);
    } else {
        // If all values bust, return the lowest value
        return Math.min(...values);
    }
};

/**
 * Determines if a hand is soft (contains an Ace counted as 11)
 *
 * @param cards Array of cards in the hand
 * @param values Array of possible hand values
 * @returns Whether the hand is soft
 */
export const isSoftHand = (cards: Card[], values: number[]): boolean => {
    // A hand is soft if:
    // 1. It contains an Ace
    // 2. It has multiple possible values
    // 3. At least one value is not a bust

    const hasAce = cards.some(card => card.isFaceUp && card.rank === 'A');
    const hasMultipleValues = values.length > 1;
    const hasNonBustValue = values.some(value => value <= 21);

    return hasAce && hasMultipleValues && hasNonBustValue;
};

/**
 * Checks if a hand is a blackjack (21 with exactly 2 cards)
 *
 * @param cards Array of cards in the hand
 * @returns Whether the hand is a blackjack
 */
export const isBlackjack = (cards: Card[]): boolean => {
    // A blackjack requires:
    // 1. Exactly 2 cards
    // 2. A value of 21
    if (cards.length !== 2 || cards.some(card => !card.isFaceUp)) {
        return false;
    }

    const values = calculateHandValues(cards);
    return values.includes(21);
};

/**
 * Checks if a hand is busted (all values over 21)
 *
 * @param values Array of possible hand values
 * @returns Whether the hand is busted
 */
export const isBustedHand = (values: number[]): boolean => {
    return values.every(value => value > 21);
};

/**
 * Determines if a hand can be split
 *
 * @param cards Array of cards in the hand
 * @returns Whether the hand can be split
 */
export const canSplitHand = (cards: Card[]): boolean => {
    // Can only split with exactly 2 face-up cards
    if (cards.length !== 2 || cards.some(card => !card.isFaceUp)) {
        return false;
    }

    // Cards must have the same rank
    return cards[0].rank === cards[1].rank;
};

/**
 * Simulates the dealer's play according to the rules
 *
 * @param dealerHand The dealer's current hand
 * @param shoe The current shoe of cards
 * @param hitSoft17 Whether the dealer hits on soft 17
 * @returns Object with final hand and updated shoe
 */
export const playDealerHandToCompletion = (
    dealerHand: Hand,
    shoe: Card[],
    hitSoft17: boolean
): { finalHand: Hand; updatedShoe: Card[] } => {
    // Create copies to avoid mutating the originals
    const updatedShoe = [...shoe];
    const hand: Hand = {
        ...dealerHand,
        cards: [...dealerHand.cards],
        values: [...dealerHand.values]
    };

    // Get current hand value
    let handValue = getBestHandValue(hand.values);
    let isHandSoft = isSoftHand(hand.cards.map(card => ({ ...card, isFaceUp: true })), hand.values);

    // Dealer draws until 17 or higher (hit soft 17 if the rule is set)
    while (
        handValue < 17 ||
        (hitSoft17 && isHandSoft && handValue === 17)
    ) {
        if (updatedShoe.length === 0) {
            // No more cards in the shoe
            break;
        }

        // Draw a card from the shoe
        const newCard = { ...updatedShoe.pop()!, isFaceUp: true };

        // Add the card to the hand
        hand.cards.push(newCard);

        // Recalculate hand values
        hand.values = calculateHandValues(hand.cards.map(card => ({ ...card, isFaceUp: true })));
        handValue = getBestHandValue(hand.values);
        isHandSoft = isSoftHand(hand.cards.map(card => ({ ...card, isFaceUp: true })), hand.values);
    }

    // Update hand properties
    hand.isBusted = isBustedHand(hand.values);
    hand.isSoft = isHandSoft;

    return { finalHand: hand, updatedShoe };
};

/**
 * Determines the result of a round
 *
 * @param playerHand The player's final hand
 * @param dealerHand The dealer's final hand
 * @returns The result of the round
 */
export const determineRoundResult = (
    playerHand: Hand,
    dealerHand: Hand
): RoundResult => {
    // If player busted, it's a loss
    if (playerHand.isBusted) {
        return 'bust';
    }

    // Check for blackjacks
    if (playerHand.isBlackjack && dealerHand.isBlackjack) {
        return 'push'; // Both have blackjack, it's a push
    }

    if (playerHand.isBlackjack) {
        return 'blackjack'; // Player has blackjack, dealer doesn't
    }

    if (dealerHand.isBlackjack) {
        return 'loss'; // Dealer has blackjack, player doesn't
    }

    // If dealer busted, player wins
    if (dealerHand.isBusted) {
        return 'win';
    }

    // Compare hand values
    const playerValue = getBestHandValue(playerHand.values);
    const dealerValue = getBestHandValue(dealerHand.values);

    if (playerValue > dealerValue) {
        return 'win';
    } else if (dealerValue > playerValue) {
        return 'loss';
    } else {
        return 'push';
    }
};

/**
 * Calculates the payout for a hand
 *
 * @param bet The bet amount
 * @param result The result of the hand
 * @param blackjackPayout The payout multiplier for blackjack
 * @returns The payout amount (including the original bet for wins)
 */
export const calculatePayout = (
    bet: number,
    result: RoundResult,
    blackjackPayout: number = 1.5
): number => {
    switch (result) {
        case 'blackjack':
            return bet + (bet * blackjackPayout);
        case 'win':
            return bet * 2;
        case 'push':
            return bet;
        case 'surrender':
            return bet / 2;
        default:
            return 0;
    }
};

/**
 * Creates a new hand object
 *
 * @param cards Array of cards in the hand
 * @param id Optional ID for the hand
 * @returns A new Hand object
 */
export const createHand = (cards: Card[], id?: string): Hand => {
    // Calculate hand properties
    const values = calculateHandValues(cards.filter(card => card.isFaceUp));
    const isBusted = isBustedHand(values);
    const isBlackjackHand = isBlackjack(cards);
    const isSoft = isSoftHand(cards, values);
    const canSplit = canSplitHand(cards);

    return {
        id: id || nanoid(),
        cards: cards.map(c => c.id),
        values,
        isBlackjack: isBlackjackHand,
        isBusted,
        isSoft,
        canSplit
    };
};

/**
 * Gets the recommended action for a player's hand
 *
 * @param playerHand The player's hand
 * @param dealerUpCard The dealer's up card
 * @param canDoubleDown Whether doubling down is allowed
 * @param canSplit Whether splitting is allowed
 * @param canSurrender Whether surrendering is allowed
 * @returns The recommended action
 */
export const getRecommendedAction = (
    playerHand: Hand,
    dealerUpCard: Card,
    canDoubleDown: boolean,
    canSplit: boolean,
    canSurrender: boolean
): 'hit' | 'stand' | 'double' | 'split' | 'surrender' => {
    // Get player hand value
    const playerValue = getBestHandValue(playerHand.values);

    // Convert dealer up card to value
    let dealerValue: number;
    if (dealerUpCard.rank === 'A') {
        dealerValue = 11;
    } else if (['J', 'Q', 'K'].includes(dealerUpCard.rank)) {
        dealerValue = 10;
    } else {
        dealerValue = parseInt(dealerUpCard.rank);
    }

    // Check for split opportunities first
    if (canSplit && playerHand.canSplit && playerHand.cards.length === 2) {
        // Get rank of cards to determine split strategy
        const cards = playerHand.cards.map(id => ({ rank: id.substring(0, id.indexOf('-')) }));
        const rank = cards[0].rank;

        // Aces and 8s should always be split
        if (rank === 'A' || rank === '8') {
            return 'split';
        }

        // Never split 10s, 5s, 4s
        if (rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') {
            // Not splitting 10s
        } else if (rank === '5') {
            // Not splitting 5s
        } else if (rank === '4') {
            // Only split 4s against 5-6
            if (dealerValue >= 5 && dealerValue <= 6) {
                return 'split';
            }
        } else if (rank === '9') {
            // Split 9s against everything except 7, 10, or Ace
            if (dealerValue !== 7 && dealerValue !== 10 && dealerValue !== 11) {
                return 'split';
            }
        } else if (rank === '7') {
            // Split 7s against 2-7
            if (dealerValue <= 7) {
                return 'split';
            }
        } else if (rank === '6') {
            // Split 6s against 2-6
            if (dealerValue <= 6) {
                return 'split';
            }
        } else if (rank === '3' || rank === '2') {
            // Split 2s and 3s against 2-7
            if (dealerValue <= 7) {
                return 'split';
            }
        }
    }

    // Check for soft hands (A + something, with A = 11)
    if (playerHand.isSoft) {
        // Soft 20 (A + 9) always stands
        if (playerValue === 20) {
            return 'stand';
        }

        // Soft 19 (A + 8) stands, except against 6 where it can double
        if (playerValue === 19) {
            if (dealerValue === 6 && canDoubleDown) {
                return 'double';
            }
            return 'stand';
        }

        // Soft 18 (A + 7)
        if (playerValue === 18) {
            // Double against 2-6
            if (dealerValue >= 2 && dealerValue <= 6 && canDoubleDown) {
                return 'double';
            }
            // Stand against 7-8
            if (dealerValue >= 7 && dealerValue <= 8) {
                return 'stand';
            }
            // Hit against 9, 10, Ace
            return 'hit';
        }

        // Soft 17 (A + 6)
        if (playerValue === 17) {
            // Double against 3-6
            if (dealerValue >= 3 && dealerValue <= 6 && canDoubleDown) {
                return 'double';
            }
            return 'hit';
        }

        // Soft 16 (A + 5) and 15 (A + 4)
        if (playerValue === 16 || playerValue === 15) {
            // Double against 4-6
            if (dealerValue >= 4 && dealerValue <= 6 && canDoubleDown) {
                return 'double';
            }
            return 'hit';
        }

        // Soft 14 (A + 3) and 13 (A + 2)
        if (playerValue === 14 || playerValue === 13) {
            // Double against 5-6
            if (dealerValue >= 5 && dealerValue <= 6 && canDoubleDown) {
                return 'double';
            }
            return 'hit';
        }
    }

    // Hard hands

    // Hard 17+ always stands
    if (playerValue >= 17) {
        return 'stand';
    }

    // Hard 16
    if (playerValue === 16) {
        // Surrender against 9-A if allowed
        if (dealerValue >= 9 && canSurrender) {
            return 'surrender';
        }
        // Stand against 2-6
        if (dealerValue <= 6) {
            return 'stand';
        }
        return 'hit';
    }

    // Hard 15
    if (playerValue === 15) {
        // Surrender against 10-A if allowed
        if ((dealerValue === 10 || dealerValue === 11) && canSurrender) {
            return 'surrender';
        }
        // Stand against 2-6
        if (dealerValue <= 6) {
            return 'stand';
        }
        return 'hit';
    }

    // Hard 13-14
    if (playerValue >= 13 && playerValue <= 14) {
        // Stand against 2-6
        if (dealerValue <= 6) {
            return 'stand';
        }
        return 'hit';
    }

    // Hard 12
    if (playerValue === 12) {
        // Stand against 4-6
        if (dealerValue >= 4 && dealerValue <= 6) {
            return 'stand';
        }
        return 'hit';
    }

    // Hard 11
    if (playerValue === 11) {
        return canDoubleDown ? 'double' : 'hit';
    }

    // Hard 10
    if (playerValue === 10) {
        if (dealerValue <= 9 && canDoubleDown) {
            return 'double';
        }
        return 'hit';
    }

    // Hard 9
    if (playerValue === 9) {
        if (dealerValue >= 3 && dealerValue <= 6 && canDoubleDown) {
            return 'double';
        }
        return 'hit';
    }

    // Hard 8 or lower
    return 'hit';
};

/**
 * Calculates the running count for card counting
 *
 * @param cards Array of visible cards
 * @returns The current running count
 */
export const calculateRunningCount = (cards: Card[]): number => {
    let count = 0;

    for (const card of cards) {
        // Skip face-down cards
        if (!card.isFaceUp) continue;

        // Hi-Lo counting system:
        // 2-6: +1, 7-9: 0, 10-A: -1
        if (['2', '3', '4', '5', '6'].includes(card.rank)) {
            count++;
        } else if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) {
            count--;
        }
    }

    return count;
};

/**
 * Calculates the true count (running count / decks remaining)
 *
 * @param runningCount The current running count
 * @param decksRemaining The number of decks remaining
 * @returns The true count
 */
export const calculateTrueCount = (
    runningCount: number,
    decksRemaining: number
): number => {
    if (decksRemaining <= 0) return 0;
    return runningCount / decksRemaining;
};

/**
 * Calculates the number of decks remaining in the shoe
 *
 * @param shoe The current shoe
 * @param dealtCards The cards already dealt
 * @param totalDecks The total number of decks in the initial shoe
 * @returns The number of decks remaining
 */
export const calculateDecksRemaining = (
    shoe: Card[],
    dealtCards: Card[],
    totalDecks: number
): number => {
    if (totalDecks <= 0) return 0;

    const totalCards = totalDecks * 52;
    const cardsRemaining = shoe.length;

    return cardsRemaining / 52;
};

/**
 * Checks if the dealer has blackjack based on up card
 *
 * @param upCard The dealer's up card
 * @param holeCard The dealer's hole card (if peeking)
 * @returns Object with probability and definite result if known
 */
export const checkDealerBlackjack = (
    upCard: Card,
    holeCard?: Card
): { probability: number; hasBlackjack: boolean | null } => {
    // If we know the hole card, we can determine definitively
    if (holeCard) {
        const cards = [upCard, holeCard];
        return {
            probability: 0, // Not needed if we know for sure
            hasBlackjack: isBlackjack(cards.map(c => ({ ...c, isFaceUp: true })))
        };
    }

    // Otherwise, calculate the probability
    let probability = 0;

    // If the up card is an Ace, the dealer needs a 10-value card
    if (upCard.rank === 'A') {
        // 16/52 remaining cards are 10-value cards (10, J, Q, K)
        probability = 16 / 51; // 51 = 52 - 1 for the up card
    }
    // If the up card is a 10-value card, the dealer needs an Ace
    else if (['10', 'J', 'Q', 'K'].includes(upCard.rank)) {
        // 4/52 remaining cards are Aces
        probability = 4 / 51; // 51 = 52 - 1 for the up card
    }

    return {
        probability,
        hasBlackjack: null // We don't know for sure
    };
};

/**
 * Evaluates Perfect Pairs side bet
 * Pays based on whether the player's first two cards form a pair
 *
 * @param cards The player's first two cards
 * @returns Result object with win status, outcome type, and payout multiplier
 */
export const evaluatePerfectPairs = (
    cards: Card[]
): { isWin: boolean; outcome: string | null; multiplier: number } => {
    // Need exactly two cards
    if (cards.length !== 2) {
        return { isWin: false, outcome: null, multiplier: 0 };
    }

    // Check if the ranks match
    if (cards[0].rank !== cards[1].rank) {
        return { isWin: false, outcome: null, multiplier: 0 };
    }

    // Perfect pair (same suit)
    if (cards[0].suit === cards[1].suit) {
        return { isWin: true, outcome: 'perfect', multiplier: 30 };
    }

    // Colored pair (same color, different suit)
    const color1 = SUIT_COLORS[cards[0].suit];
    const color2 = SUIT_COLORS[cards[1].suit];

    if (color1 === color2) {
        return { isWin: true, outcome: 'colored', multiplier: 10 };
    }

    // Mixed pair (different color)
    return { isWin: true, outcome: 'mixed', multiplier: 5 };
};

/**
 * Evaluates 21+3 side bet (3-card poker hand with player's first two cards and dealer's up card)
 *
 * @param playerCards The player's first two cards
 * @param dealerUpCard The dealer's up card
 * @returns Result object with win status, outcome type, and payout multiplier
 */
export const evaluate21Plus3 = (
    playerCards: Card[],
    dealerUpCard: Card
): { isWin: boolean; outcome: string | null; multiplier: number } => {
    // Need exactly two player cards and one dealer card
    if (playerCards.length !== 2 || !dealerUpCard) {
        return { isWin: false, outcome: null, multiplier: 0 };
    }

    // Combine cards for evaluation
    const allCards = [...playerCards, dealerUpCard].map(c => ({ ...c, isFaceUp: true }));

    // Check for three of a kind
    if (
        allCards[0].rank === allCards[1].rank &&
        allCards[1].rank === allCards[2].rank
    ) {
        return { isWin: true, outcome: 'threeOfAKind', multiplier: 30 };
    }

    // Check for straight flush (same suit and consecutive ranks)
    const isSameSuit = allCards[0].suit === allCards[1].suit &&
        allCards[1].suit === allCards[2].suit;

    // Convert ranks to numerical values for straight check
    const rankValues = allCards.map(card => {
        if (card.rank === 'A') return 14;
        if (card.rank === 'K') return 13;
        if (card.rank === 'Q') return 12;
        if (card.rank === 'J') return 11;
        return parseInt(card.rank);
    }).sort((a, b) => a - b);

    // Special case for A-2-3 straight
    const isA23Straight = rankValues[0] === 2 && rankValues[1] === 3 && rankValues[2] === 14;

    // Check if ranks are consecutive
    const isConsecutive = (rankValues[0] + 1 === rankValues[1] &&
        rankValues[1] + 1 === rankValues[2]) || isA23Straight;

    if (isSameSuit && isConsecutive) {
        return { isWin: true, outcome: 'straightFlush', multiplier: 40 };
    }

    // Check for straight
    if (isConsecutive) {
        return { isWin: true, outcome: 'straight', multiplier: 10 };
    }

    // Check for flush
    if (isSameSuit) {
        return { isWin: true, outcome: 'flush', multiplier: 5 };
    }

    // Check for pair
    if (
        allCards[0].rank === allCards[1].rank ||
        allCards[1].rank === allCards[2].rank ||
        allCards[0].rank === allCards[2].rank
    ) {
        return { isWin: true, outcome: 'pair', multiplier: 1 };
    }

    // No winning combination
    return { isWin: false, outcome: null, multiplier: 0 };
};

/**
 * Evaluates Lucky Ladies side bet (player's hand totals 20, with higher payouts for Queens)
 *
 * @param cards The player's first two cards
 * @param dealerHasBlackjack Whether the dealer has blackjack
 * @returns Result object with win status, outcome type, and payout multiplier
 */
export const evaluateLuckyLadies = (
    cards: Card[],
    dealerHasBlackjack: boolean = false
): { isWin: boolean; outcome: string | null; multiplier: number } => {
    // Need exactly two cards
    if (cards.length !== 2) {
        return { isWin: false, outcome: null, multiplier: 0 };
    }

    // Pair of Queen of Hearts with dealer blackjack
    if (
        cards[0].rank === 'Q' && cards[0].suit === 'hearts' &&
        cards[1].rank === 'Q' && cards[1].suit === 'hearts' &&
        dealerHasBlackjack
    ) {
        return { isWin: true, outcome: 'queenOfHeartsWithDealerBJ', multiplier: 1000 };
    }

    // Pair of Queen of Hearts
    if (
        cards[0].rank === 'Q' && cards[0].suit === 'hearts' &&
        cards[1].rank === 'Q' && cards[1].suit === 'hearts'
    ) {
        return { isWin: true, outcome: 'queenOfHearts', multiplier: 200 };
    }

    // Matched Queens (same suit)
    if (
        cards[0].rank === 'Q' && cards[1].rank === 'Q' &&
        cards[0].suit === cards[1].suit
    ) {
        return { isWin: true, outcome: 'matchedQueens', multiplier: 25 };
    }

    // Any pair of Queens
    if (cards[0].rank === 'Q' && cards[1].rank === 'Q') {
        return { isWin: true, outcome: 'queenPair', multiplier: 10 };
    }

    // Any Queen
    if (cards[0].rank === 'Q' || cards[1].rank === 'Q') {
        return { isWin: true, outcome: 'anyQueen', multiplier: 5 };
    }

    // Hand totaling 20
    const handValue = getBestHandValue(calculateHandValues(cards.map(c => ({ ...c, isFaceUp: true }))));
    if (handValue === 20) {
        return { isWin: true, outcome: 'twentyTotal', multiplier: 4 };
    }

    // No win
    return { isWin: false, outcome: null, multiplier: 0 };
};

/**
 * Evaluates insurance bet
 *
 * @param dealerCards The dealer's cards
 * @returns Whether the insurance bet wins
 */
export const evaluateInsurance = (dealerCards: Card[]): boolean => {
    // Ensure dealer has at least 2 cards
    if (dealerCards.length < 2) return false;

    // Insurance wins if dealer has blackjack
    return isBlackjack(dealerCards.map(c => ({ ...c, isFaceUp: true })));
};

/**
 * Splits a hand into two separate hands
 *
 * @param hand The hand to split
 * @param shoe The current shoe of cards
 * @param dealToSplitHands Whether to deal a card to each new hand
 * @returns Object with two new hands and updated shoe
 */
export const splitHand = (
    hand: Hand,
    shoe: Card[],
    dealToSplitHands = true
): { hand1: Hand; hand2: Hand; updatedShoe: Card[] } => {
    // Can only split a hand with exactly 2 cards
    if (hand.cards.length !== 2) {
        throw new Error('Can only split a hand with exactly 2 cards');
    }

    // Create a copy of the shoe
    const updatedShoe = [...shoe];

    // Create two new hands, each with one card from the original hand
    const hand1Cards = [{ ...hand.cards[0], isFaceUp: true }];
    const hand2Cards = [{ ...hand.cards[1], isFaceUp: true }];

    // Deal a card to each new hand if requested
    if (dealToSplitHands && updatedShoe.length >= 2) {
        // Deal to first hand
        const card1 = { ...updatedShoe.pop()!, isFaceUp: true };
        hand1Cards.push(card1);

        // Deal to second hand
        const card2 = { ...updatedShoe.pop()!, isFaceUp: true };
        hand2Cards.push(card2);
    }

    // Create Hand objects
    const hand1 = createHand(hand1Cards);
    const hand2 = createHand(hand2Cards);

    // Special handling for split aces
    const isAceSplit = hand.cards[0].rank === 'A';
    if (isAceSplit) {
        // Mark hands as restricted (no hitting after split aces)
        hand1.restrictedToOneCard = true;
        hand2.restrictedToOneCard = true;
    }

    return { hand1, hand2, updatedShoe };
};

/**
 * Performs a double down action
 *
 * @param hand The hand to double down on
 * @param shoe The current shoe of cards
 * @returns Object with updated hand and shoe
 */
export const doubleDown = (
    hand: Hand,
    shoe: Card[]
): { updatedHand: Hand; updatedShoe: Card[] } => {
    // Can only double down on hands with 2 cards
    if (hand.cards.length !== 2) {
        throw new Error('Can only double down on a hand with exactly 2 cards');
    }

    // Create a copy of the shoe
    const updatedShoe = [...shoe];

    // Deal one card to the hand
    if (updatedShoe.length === 0) {
        throw new Error('No cards left in shoe');
    }

    const newCard = { ...updatedShoe.pop()!, isFaceUp: true };
    const updatedCards = [...hand.cards.map(c => ({ ...c, isFaceUp: true })), newCard];

    // Create an updated hand
    const updatedHand = createHand(updatedCards, hand.id);

    // Mark the hand as doubled
    updatedHand.doubled = true;

    return { updatedHand, updatedShoe };
};

/**
 * Validates if an action is allowed based on current game state
 *
 * @param action The action to validate
 * @param playerHand The player's current hand
 * @param dealerHand The dealer's current hand
 * @param gameRules The game rules
 * @param chips The player's available chips
 * @param bet The current bet amount
 * @returns Whether the action is allowed
 */
export const isActionAllowed = (
    action: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance',
    playerHand: Hand,
    dealerHand: Hand,
    gameRules: GameRules,
    chips: number,
    bet: number
): boolean => {
    // Stand is always allowed during player's turn
    if (action === 'stand') {
        return true;
    }

    // Hit is allowed unless hand is restricted (e.g., after splitting aces)
    if (action === 'hit') {
        return !playerHand.restrictedToOneCard;
    }

    // Double down
    if (action === 'double') {
        // Need enough chips to double the bet
        if (chips < bet) {
            return false;
        }

        // Can only double on first two cards
        if (playerHand.cards.length !== 2) {
            return false;
        }

        // Check if hand is a split hand and if doubling after split is allowed
        if (playerHand.isSplit && !gameRules.doubleAfterSplit) {
            return false;
        }

        return gameRules.doubleAllowed;
    }

    // Split
    if (action === 'split') {
        // Need enough chips to place another bet
        if (chips < bet) {
            return false;
        }

        // Need exactly two cards of the same rank
        if (playerHand.cards.length !== 2 || !playerHand.canSplit) {
            return false;
        }

        // Check if splitting aces is restricted
        if (
            playerHand.cards[0].rank === 'A' &&
            !gameRules.resplitAces
        ) {
            return false;
        }

        return true;
    }

    // Surrender
    if (action === 'surrender') {
        // Can only surrender on first two cards
        if (playerHand.cards.length !== 2) {
            return false;
        }

        // Check if surrender is allowed by the rules
        return gameRules.surrender;
    }

    // Insurance
    if (action === 'insurance') {
        // Need enough chips for insurance (half the original bet)
        if (chips < bet / 2) {
            return false;
        }

        // Dealer's up card must be an Ace
        if (dealerHand.cards[0].rank !== 'A') {
            return false;
        }

        // Check if insurance is allowed by the rules
        return gameRules.insuranceAvailable;
    }

    return false;
};

/**
 * Collects game statistics from a completed round
 *
 * @param result The result of the round
 * @param playerHand The player's final hand
 * @param dealerHand The dealer's final hand
 * @param bet The bet amount
 * @param currentStats The current statistics object
 * @returns Updated statistics object
 */
export const updateGameStatistics = (
    result: RoundResult,
    playerHand: Hand,
    dealerHand: Hand,
    bet: number,
    currentStats: any
): any => {
    // Create a copy of the current stats
    const stats = { ...currentStats };

    // Increment hands played
    stats.handsPlayed = (stats.handsPlayed || 0) + 1;

    // Update specific statistics based on result
    switch (result) {
        case 'blackjack':
            stats.blackjacks = (stats.blackjacks || 0) + 1;
            stats.handsWon = (stats.handsWon || 0) + 1;
            break;

        case 'win':
            stats.handsWon = (stats.handsWon || 0) + 1;
            break;

        case 'push':
            stats.pushes = (stats.pushes || 0) + 1;
            break;

        case 'bust':
            stats.busts = (stats.busts || 0) + 1;
            stats.handsLost = (stats.handsLost || 0) + 1;
            break;

        case 'loss':
            stats.handsLost = (stats.handsLost || 0) + 1;
            break;
    }

    // Calculate win amount
    const winAmount = calculatePayout(bet, result) - bet;

    // Update biggest win if applicable
    if (winAmount > 0 && winAmount > (stats.biggestWin || 0)) {
        stats.biggestWin = winAmount;
    }

    // Update total profit
    stats.totalProfit = (stats.totalProfit || 0) + winAmount;

    // Calculate win rate
    if (stats.handsPlayed > 0) {
        stats.winRate = stats.handsWon / stats.handsPlayed;
    }

    return stats;
};

/**
 * Validates and applies game rules to ensure consistency
 *
 * @param rules The game rules to validate
 * @returns Validated and normalized game rules
 */
export const validateGameRules = (rules: Partial<GameRules>): GameRules => {
    // Start with default Vegas rules
    const validatedRules: GameRules = { ...VEGAS_RULES };

    // Apply provided rules, ensuring they are within valid ranges
    if (rules.decksCount !== undefined) {
        validatedRules.decksCount = Math.max(1, Math.min(8, rules.decksCount));
    }

    if (rules.dealerHitsSoft17 !== undefined) {
        validatedRules.dealerHitsSoft17 = rules.dealerHitsSoft17;
    }

    if (rules.blackjackPayout !== undefined) {
        // Ensure blackjack payout is one of the valid values
        if ([1, 1.2, 1.5].includes(rules.blackjackPayout)) {
            validatedRules.blackjackPayout = rules.blackjackPayout as 1 | 1.2 | 1.5;
        }
    }

    if (rules.doubleAllowed !== undefined) {
        validatedRules.doubleAllowed = rules.doubleAllowed;
    }

    if (rules.doubleAfterSplit !== undefined) {
        validatedRules.doubleAfterSplit = rules.doubleAfterSplit;
    }

    if (rules.surrender !== undefined) {
        validatedRules.surrender = rules.surrender;
    }

    if (rules.insuranceAvailable !== undefined) {
        validatedRules.insuranceAvailable = rules.insuranceAvailable;
    }

    if (rules.maxSplits !== undefined) {
        validatedRules.maxSplits = Math.max(1, Math.min(4, rules.maxSplits));
    }

    if (rules.resplitAces !== undefined) {
        validatedRules.resplitAces = rules.resplitAces;
    }

    if (rules.hitSplitAces !== undefined) {
        validatedRules.hitSplitAces = rules.hitSplitAces;
    }

    return validatedRules;
};

/**
 * Gets the house edge based on game rules
 *
 * @param rules The game rules
 * @returns The house edge as a percentage
 */
export const calculateHouseEdge = (rules: GameRules): number => {
    // Base house edge for standard rules
    let houseEdge = 0.5;

    // Adjustments based on rules

    // Blackjack payout
    if (rules.blackjackPayout === 1.5) {
        // Standard 3:2 payout
        houseEdge -= 0;
    } else if (rules.blackjackPayout === 1.2) {
        // 6:5 payout increases house edge
        houseEdge += 1.4;
    } else if (rules.blackjackPayout === 1) {
        // 1:1 payout significantly increases house edge
        houseEdge += 2.3;
    }

    // Number of decks
    if (rules.decksCount === 1) {
        houseEdge -= 0.48;
    } else if (rules.decksCount === 2) {
        houseEdge -= 0.19;
    } else if (rules.decksCount === 4) {
        houseEdge -= 0.06;
    }
    // 6-8 decks is standard, no adjustment

    // Dealer hits soft 17
    if (rules.dealerHitsSoft17) {
        houseEdge += 0.2;
    } else {
        houseEdge -= 0;
    }

    // Double down allowed
    if (rules.doubleAllowed) {
        houseEdge -= 0.25;
    } else {
        houseEdge += 0.25;
    }

    // Double after split
    if (rules.doubleAfterSplit) {
        houseEdge -= 0.15;
    } else {
        houseEdge += 0.15;
    }

    // Surrender
    if (rules.surrender) {
        houseEdge -= 0.08;
    } else {
        houseEdge += 0;
    }

    // Resplit aces
    if (rules.resplitAces) {
        houseEdge -= 0.05;
    } else {
        houseEdge += 0;
    }

    // Hit split aces
    if (rules.hitSplitAces) {
        houseEdge -= 0.18;
    } else {
        houseEdge += 0;
    }

    return Math.max(0, houseEdge);
};

/**
 * Simulates multiple rounds of blackjack to estimate player advantage
 *
 * @param rules The game rules
 * @param strategy The strategy function to use
 * @param numRounds The number of rounds to simulate
 * @returns The player advantage as a percentage
 */
export const simulatePlayerAdvantage = (
    rules: GameRules,
    strategy: (playerHand: Hand, dealerUpCard: Card) => 'hit' | 'stand' | 'double' | 'split' | 'surrender',
    numRounds: number = 10000
): number => {
    let totalBet = 0;
    let totalReturn = 0;

    for (let i = 0; i < numRounds; i++) {
        // Create a fresh shoe
        const shoe = createShoe(rules.decksCount);

        // Deal initial cards
        const playerCards = [
            { ...shoe.pop()!, isFaceUp: true },
            { ...shoe.pop()!, isFaceUp: true }
        ];

        const dealerCards = [
            { ...shoe.pop()!, isFaceUp: true },
            { ...shoe.pop()!, isFaceUp: false }
        ];

        // Create hands
        const playerHand = createHand(playerCards);
        const dealerHand = createHand(dealerCards);

        // Place bet (assume 1 unit)
        const bet = 1;
        totalBet += bet;

        // Check for blackjack
        if (playerHand.isBlackjack) {
            // Check if dealer also has blackjack
            const dealerBlackjack = isBlackjack([
                dealerCards[0],
                { ...dealerCards[1], isFaceUp: true }
            ]);

            if (dealerBlackjack) {
                // Push
                totalReturn += bet;
            } else {
                // Player blackjack
                totalReturn += bet + (bet * rules.blackjackPayout);
            }

            continue;
        }

        // Apply strategy
        let playerAction = strategy(playerHand, dealerCards[0]);

        // Handle double down
        if (playerAction === 'double') {
            totalBet += bet; // Double the bet

            // Deal one more card
            const newCard = { ...shoe.pop()!, isFaceUp: true };
            playerCards.push(newCard);

            // Update player hand
            const updatedPlayerHand = createHand(playerCards);

            // If busted, dealer doesn't need to play
            if (updatedPlayerHand.isBusted) {
                continue; // Loss, no return
            }

            // Dealer plays (reveal hole card)
            dealerCards[1].isFaceUp = true;
            let updatedDealerHand = createHand(dealerCards);

            // Dealer draws until 17 or higher
            while (getBestHandValue(updatedDealerHand.values) < 17 ||
                (rules.dealerHitsSoft17 &&
                    updatedDealerHand.isSoft &&
                    getBestHandValue(updatedDealerHand.values) === 17)) {
                const newCard = { ...shoe.pop()!, isFaceUp: true };
                dealerCards.push(newCard);
                updatedDealerHand = createHand(dealerCards);
            }

            // Determine result
            const result = determineRoundResult(updatedPlayerHand, updatedDealerHand);

            // Calculate return (doubled)
            if (result === 'win') {
                totalReturn += bet * 4; // Original bet + double + win amount
            } else if (result === 'push') {
                totalReturn += bet * 2; // Return doubled bet
            }
            // Loss results in 0 return

            continue;
        }

        // Handle surrender
        if (playerAction === 'surrender' && rules.surrender) {
            totalReturn += bet / 2; // Return half the bet
            continue;
        }

        // Handle hit/stand strategy
        let currentPlayerHand = { ...playerHand };
        const currentPlayerCards = [...playerCards];

        // Continue hitting until stand or bust
        while (playerAction === 'hit' && !currentPlayerHand.isBusted) {
            // Deal a new card
            const newCard = { ...shoe.pop()!, isFaceUp: true };
            currentPlayerCards.push(newCard);

            // Update player hand
            currentPlayerHand = createHand(currentPlayerCards);

            // Get next action
            playerAction = strategy(currentPlayerHand, dealerCards[0]);
        }

        // If player busted, dealer doesn't need to play
        if (currentPlayerHand.isBusted) {
            continue; // Loss, no return
        }

        // Dealer plays (reveal hole card)
        dealerCards[1].isFaceUp = true;
        let currentDealerHand = createHand(dealerCards);

        // Dealer draws until 17 or higher
        while (getBestHandValue(currentDealerHand.values) < 17 ||
            (rules.dealerHitsSoft17 &&
                currentDealerHand.isSoft &&
                getBestHandValue(currentDealerHand.values) === 17)) {
            const newCard = { ...shoe.pop()!, isFaceUp: true };
            dealerCards.push(newCard);
            currentDealerHand = createHand(dealerCards);
        }

        // Determine result
        const result = determineRoundResult(currentPlayerHand, currentDealerHand);

        // Calculate return
        if (result === 'win') {
            totalReturn += bet * 2; // Original bet + win amount
        } else if (result === 'push') {
            totalReturn += bet; // Return original bet
        }
        // Loss results in 0 return
    }

    // Calculate player advantage
    const playerAdvantage = (totalReturn / totalBet) - 1;

    return playerAdvantage * 100; // Convert to percentage
};