/**
 * Validation utilities for the blackjack game application
 */

import type { Card, Hand } from '@/types/gameTypes';
import { ValidationResult } from '@/types/game';
import { calculateHandValues } from '@/lib/utils/gameLogic';

/**
 * Validates if a bet amount is valid
 * @param amount The bet amount
 * @param chips The available chips
 * @param minimumBet The minimum bet
 * @param maximumBet The maximum bet
 */
export const validateBet = (
    amount: number,
    chips: number,
    minimumBet: number,
    maximumBet: number
): ValidationResult<number> => {
    const errors: string[] = [];

    if (amount < minimumBet) {
        errors.push(`Bet must be at least ${minimumBet}`);
    }

    if (amount > maximumBet) {
        errors.push(`Bet cannot exceed maximum of ${maximumBet}`);
    }

    if (amount > chips) {
        errors.push('Not enough chips');
    }

    if (amount % 1 !== 0) {
        errors.push('Bet must be a whole number');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? amount : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
};

/**
 * Validates if a hand can be split
 * @param hand The hand to check
 * @param chips The available chips
 * @param currentBet The current bet amount
 * @param maxSplits The maximum allowed splits
 * @param currentSplitCount The current number of splits
 */
export const validateSplit = (
    hand: Hand,
    chips: number,
    currentBet: number,
    maxSplits: number,
    currentSplitCount: number
): ValidationResult<true> => {
    const errors: string[] = [];

    if (hand.cards.length !== 2) {
        errors.push('Can only split with two cards');
    }

    if (!hand.canSplit) {
        errors.push('Cards must be of equal value to split');
    }

    if (chips < currentBet) {
        errors.push('Not enough chips to split');
    }

    if (currentSplitCount >= maxSplits) {
        errors.push(`Maximum of ${maxSplits} splits allowed`);
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? true : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
};

/**
 * Validates if a hand can be doubled down
 * @param hand The hand to check
 * @param chips The available chips
 * @param currentBet The current bet amount
 * @param canDoubleAfterSplit Whether doubling after split is allowed
 * @param isSplitHand Whether this is a split hand
 */
export const validateDoubleDown = (
    hand: Hand,
    chips: number,
    currentBet: number,
    canDoubleAfterSplit: boolean,
    isSplitHand = false
): ValidationResult<true> => {
    const errors: string[] = [];

    if (hand.cards.length !== 2) {
        errors.push('Can only double down on first two cards');
    }

    if (chips < currentBet) {
        errors.push('Not enough chips to double down');
    }

    if (isSplitHand && !canDoubleAfterSplit) {
        errors.push('Cannot double down after split');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? true : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
};

/**
 * Validates if insurance can be taken
 * @param dealerUpCard The dealer's up card
 * @param chips The available chips
 * @param currentBet The current bet amount
 * @param insuranceAvailable Whether insurance is available in game rules
 */
export const validateInsurance = (
    dealerUpCard: Card,
    chips: number,
    currentBet: number,
    insuranceAvailable: boolean
): ValidationResult<true> => {
    const errors: string[] = [];

    if (!insuranceAvailable) {
        errors.push('Insurance not available in current game rules');
    }

    if (dealerUpCard.rank !== 'A') {
        errors.push('Insurance only available when dealer shows an Ace');
    }

    const insuranceCost = currentBet / 2;
    if (chips < insuranceCost) {
        errors.push('Not enough chips for insurance');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? true : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
};

/**
 * Validates if a hand can be surrendered
 * @param hand The hand to check
 * @param playerTurn Whether it's the player's turn
 * @param surrenderAllowed Whether surrender is allowed in game rules
 */
export const validateSurrender = (
    hand: Hand,
    playerTurn: boolean,
    surrenderAllowed: boolean
): ValidationResult<true> => {
    const errors: string[] = [];

    if (!surrenderAllowed) {
        errors.push('Surrender not allowed in current game rules');
    }

    if (!playerTurn) {
        errors.push('Can only surrender during player turn');
    }

    if (hand.cards.length !== 2) {
        errors.push('Can only surrender on initial two cards');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? true : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
};

/**
 * Validates a hand for blackjack
 * @param hand The hand to check
 */
export const validateBlackjack = (hand: Hand): boolean => {
    // Must have exactly 2 cards
    if (hand.cards.length !== 2) return false;

    // Must have a value of 21
    const hasValue21 = hand.values.includes(21);

    return hasValue21;
};

/**
 * Validates if a hand is busted
 * @param hand The hand to check
 */
export const validateBust = (hand: Hand): boolean => {
    // A hand is busted if all possible values are over 21
    return hand.values.every(value => value > 21);
};

/**
 * Validates if the game state is valid (debugging utility)
 * @param gameState The game state to validate
 */
export const validateGameState = (gameState: any): ValidationResult<true> => {
    const errors: string[] = [];

    // Check for required properties
    if (!gameState.shoe || !Array.isArray(gameState.shoe)) {
        errors.push('Game state missing shoe array');
    }

    if (!gameState.gamePhase) {
        errors.push('Game state missing game phase');
    }

    if (gameState.bet < 0) {
        errors.push('Game state has negative bet value');
    }

    if (gameState.chips < 0) {
        errors.push('Game state has negative chips value');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? true : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
};