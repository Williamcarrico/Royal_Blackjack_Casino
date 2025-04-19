/**
 * Game engine with core game logic for blackjack
 *
 * This module contains pure functions for blackjack game logic,
 * separated from state management concerns.
 */
import { v4 as uuidv4 } from 'uuid';
import { GameState, GameOptions, GameAction, GameRound, GamePhase, GameStatus } from '../../types/gameTypes';
import { Card, Shoe } from '../../domains/card/cardTypes';
import { Hand, DealerHand, HandAction, HandStatus, HandResult } from '../../types/handTypes';
import { Bet } from '../../types/betTypes';
// Import hand calculation functions to avoid duplication
import * as handCalculator from '../hands/handCalculator';

// Define enum values to match their type definitions
export enum LocalHandStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    BUSTED = 'busted',
    STAND = 'stand',
    SURRENDERED = 'surrendered'
}

export enum LocalGameStatus {
    IDLE = 'idle',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    PAUSED = 'paused'
}

export enum LocalGamePhase {
    BETTING = 'betting',
    DEAL = 'deal',
    PLAYER_TURN = 'playerTurn',
    DEALER_TURN = 'dealerTurn',
    SETTLEMENT = 'settlement',
    CLEANUP = 'cleanup'
}

// Create type aliases
export type { GameRound, Bet };

/**
 * Creates an initial empty game state
 */
export const createInitialGameState = (options: GameOptions): GameState => {
    // Create empty shoe
    const shoe: Shoe = {
        id: uuidv4(),
        decks: [],
        cards: [],
        remaining: 0,
        penetration: options.penetration,
        cutCardPosition: 0,
        isShuffled: false
    };

    // Create empty dealer hand
    const dealerHand: DealerHand = {
        id: uuidv4(),
        cards: [],
        values: [0],
        bestValue: 0,
        status: LocalHandStatus.ACTIVE,
        hasHiddenCard: false
    };

    // Create game state
    return {
        id: uuidv4(),
        status: LocalGameStatus.IDLE,
        currentPhase: LocalGamePhase.BETTING,
        shoe,
        dealer: {
            hand: dealerHand,
            isRevealed: false
        },
        players: [],
        activePlayerIndex: -1,
        activeHandIndex: -1,
        options,
        roundNumber: 0,
        timestamp: new Date(),
        history: [] as GameRound[],
        // Add missing properties from GameState type
        decks: [],
        lastShuffle: new Date(),
        deckPenetration: options.penetration || 0.75
    };
};

/**
 * Calculate all possible values for a hand (accounting for Aces)
 * Use the handCalculator to ensure consistent logic
 */
export const calculateHandValues = handCalculator.calculateValues;

/**
 * Determine the best value for a hand
 * The best value is the highest value that doesn't exceed 21
 */
export const determineBestValue = handCalculator.determineBestValue;

/**
 * Check if a hand is a blackjack (21 with exactly 2 cards)
 */
export const isBlackjack = handCalculator.isBlackjack;

/**
 * Check if a hand is busted (value exceeds 21)
 */
export const isBusted = handCalculator.isBusted;

/**
 * Check if a hand is soft (contains an Ace counted as 11)
 */
export const isSoft = handCalculator.isSoft;

/**
 * Determine if dealer should hit or stand
 * Based on dealer rules (hit on soft 17 or stand on all 17s)
 */
export const shouldDealerHit = (dealerHand: DealerHand, hitSoft17: boolean): boolean => {
    const { bestValue } = dealerHand;

    // Always hit on 16 or less
    if (bestValue < 17) {
        return true;
    }

    // Always stand on hard 18+
    if (bestValue > 17) {
        return false;
    }

    // For 17, depends on whether it's soft and rule setting
    if (bestValue === 17) {
        // If it's a soft 17 and rule is to hit soft 17, then hit
        return hitSoft17 && isSoft(dealerHand);
    }

    return false;
};

/**
 * Get available actions for a hand based on its current state and rules
 * Use handCalculator's implementation for consistency
 */
export const getAvailableActions = handCalculator.getAvailableActions;

/**
 * Compare dealer and player hands to determine the result
 */
export const compareHands = (playerHand: Hand, dealerHand: DealerHand): HandResult => {
    // Check for blackjack
    const playerHasBlackjack = isBlackjack(playerHand);
    const dealerHasBlackjack = isBlackjack(dealerHand);

    // If player busted, they lose regardless of dealer's hand
    if (isBusted(playerHand)) {
        return 'loss';
    }

    // If dealer busted, player wins
    if (isBusted(dealerHand)) {
        return 'win';
    }

    // Both have blackjack = push
    if (playerHasBlackjack && dealerHasBlackjack) {
        return 'push';
    }

    // Player has blackjack but dealer doesn't = blackjack win
    if (playerHasBlackjack && !dealerHasBlackjack) {
        return 'blackjack';
    }

    // Dealer has blackjack but player doesn't = loss
    if (!playerHasBlackjack && dealerHasBlackjack) {
        return 'loss';
    }

    // Compare hand values
    if (playerHand.bestValue > dealerHand.bestValue) {
        return 'win';
    } else if (playerHand.bestValue < dealerHand.bestValue) {
        return 'loss';
    } else {
        return 'push';
    }
};

/**
 * Calculate the payout amount for a bet based on the hand result
 */
export const calculatePayout = (bet: Bet | number, result: HandResult, blackjackPayout: number = 1.5): number => {
    // Convert Bet object to number if needed
    const betAmount = typeof bet === 'number' ? bet : bet.amount;

    switch (result) {
        case 'win':
            return betAmount * 2; // Original bet + 1:1 win
        case 'blackjack':
            return betAmount * (1 + blackjackPayout); // Original bet + blackjack payout (typically 3:2)
        case 'push':
            return betAmount; // Return original bet
        case 'loss':
            return 0; // Lose bet
        case 'surrender':
            return betAmount / 2; // Return half the bet
        case 'pending':
            return betAmount; // Bet not resolved yet
        case 'insurance':
            return betAmount * 3; // Original bet + 2:1 insurance payout
        default:
            return 0;
    }
};

/**
 * Check if all player hands are completed
 */
export const areAllHandsCompleted = (gameState: GameState): boolean => {
    for (const player of gameState.players) {
        for (const hand of player.hands) {
            if (hand.status === LocalHandStatus.ACTIVE) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Advance to the next active hand
 */
export const advanceToNextHand = (gameState: GameState): GameState => {
    const { players, activePlayerIndex, activeHandIndex } = gameState;
    const newState = { ...gameState };

    // If no active player, return unchanged
    if (activePlayerIndex === -1) {
        return newState;
    }

    // Try to find next active hand for current player
    const nextHandIndex = findNextActiveHandForCurrentPlayer(players, activePlayerIndex, activeHandIndex);
    if (nextHandIndex !== -1) {
        newState.activeHandIndex = nextHandIndex;
        return newState;
    }

    // Try to find next player with active hand
    const { nextPlayerIndex, firstActiveHandIndex } = findNextPlayerWithActiveHand(players, activePlayerIndex);
    if (nextPlayerIndex !== -1) {
        newState.activePlayerIndex = nextPlayerIndex;
        newState.activeHandIndex = firstActiveHandIndex;
        return newState;
    }

    // If no more active hands found, set indices to -1
    newState.activePlayerIndex = -1;
    newState.activeHandIndex = -1;

    // If all hands are completed, advance to dealer phase
    if (areAllHandsCompleted(newState)) {
        newState.currentPhase = LocalGamePhase.DEALER_TURN;
    }

    return newState;
};

// Helper function to find next active hand for current player
const findNextActiveHandForCurrentPlayer = (
    players: GameState['players'],
    activePlayerIndex: number,
    activeHandIndex: number
): number => {
    const activePlayer = players[activePlayerIndex];

    if (!activePlayer || activeHandIndex >= activePlayer.hands.length - 1) {
        return -1;
    }

    for (let i = activeHandIndex + 1; i < activePlayer.hands.length; i++) {
        if (activePlayer.hands[i]?.status === LocalHandStatus.ACTIVE) {
            return i;
        }
    }

    return -1;
};

// Helper function to find next player with active hand
const findNextPlayerWithActiveHand = (
    players: GameState['players'],
    activePlayerIndex: number
): { nextPlayerIndex: number; firstActiveHandIndex: number } => {
    for (let i = activePlayerIndex + 1; i < players.length; i++) {
        const nextPlayer = players[i];

        if (!nextPlayer) continue;

        for (let j = 0; j < nextPlayer.hands.length; j++) {
            if (nextPlayer.hands[j]?.status === LocalHandStatus.ACTIVE) {
                return { nextPlayerIndex: i, firstActiveHandIndex: j };
            }
        }
    }

    return { nextPlayerIndex: -1, firstActiveHandIndex: -1 };
};

/**
 * Determine if it's time to shuffle the shoe based on penetration
 */
export const shouldShuffleShoe = (shoe: Shoe): boolean => {
    if (!shoe) return false;

    const cardsDealt = shoe.cards.length - shoe.remaining;
    return cardsDealt >= shoe.cutCardPosition;
};

/**
 * Process a round of dealer actions according to the rules
 */
export const processDealerTurn = (dealerHand: DealerHand, hitSoft17: boolean): boolean => {
    // If dealer has blackjack, no need to draw more cards
    if (isBlackjack(dealerHand)) {
        return false; // No more actions needed
    }

    // Return whether dealer should take another card
    return shouldDealerHit(dealerHand, hitSoft17);
};

/**
 * Settle all player hands against the dealer's hand
 */
export const settleAllHands = (
    playerHands: Hand[],
    dealerHand: DealerHand,
    blackjackPayout: number = 1.5
): Record<string, { result: HandResult, payout: number }> => {
    const results: Record<string, { result: HandResult, payout: number }> = {};

    playerHands.forEach(hand => {
        if (hand.status === LocalHandStatus.SURRENDERED) {
            results[hand.id] = {
                result: 'surrender',
                payout: calculatePayout(hand.bet, 'surrender', blackjackPayout)
            };
        } else if (hand.status === LocalHandStatus.BUSTED) {
            results[hand.id] = {
                result: 'loss',
                payout: 0
            };
        } else {
            const result = compareHands(hand, dealerHand);
            results[hand.id] = {
                result,
                payout: calculatePayout(hand.bet, result, blackjackPayout)
            };
        }
    });

    return results;
};

/**
 * Create a new game action record
 */
export const createGameAction = (
    type: string,
    playerId: string,
    handId?: string,
    amount?: number,
    card?: Card
): GameAction => {
    return {
        type,
        playerId,
        handId,
        amount,
        card,
        timestamp: new Date()
    };
};

/**
 * Get probability of winning with a hand
 * Uses the handCalculator's advanced statistical methods
 */
export const getWinProbability = handCalculator.calculateHandOutcomeProbabilities;

// Type re-exports
export type { HandStatus, GamePhase, GameStatus };

export default {
    // Card and hand evaluation
    calculateHandValues,
    determineBestValue,
    isBlackjack,
    isBusted,
    isSoft,
    shouldDealerHit,

    // Game flow and actions
    getAvailableActions,
    compareHands,
    calculatePayout,
    areAllHandsCompleted,
    advanceToNextHand,
    shouldShuffleShoe,
    processDealerTurn,
    settleAllHands,
    createGameAction,

    // Game state creation
    createInitialGameState,

    // Advanced statistics
    getWinProbability,

    // Status and phase enums
    LocalHandStatus,
    LocalGameStatus,
    LocalGamePhase
};