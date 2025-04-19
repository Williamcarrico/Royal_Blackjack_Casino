/**
 * Hand domain model types for Royal Blackjack Casino
 */

import { HandID } from '../branded';
import { HandStatus, HandAction, OutcomeType } from '../enums';
import { Card } from './card';

/**
 * Hand result (after comparison with dealer)
 */
export enum HandResult {
    WIN = 'win',
    BLACKJACK = 'blackjack',
    PUSH = 'push',
    LOSS = 'loss',
    SURRENDER = 'surrender',
    INSURANCE = 'insurance',
    PENDING = 'pending'
}

/**
 * Player hand
 */
export interface Hand {
    id: HandID;
    cards: Card[];
    values: number[]; // Multiple possible values (for aces)
    bestValue: number; // Best value without busting
    status: HandStatus;
    result?: HandResult;
    actions: HandAction[]; // Available actions
    bet: number;
    insuranceBet?: number;
    isDoubled: boolean;
    isSplit: boolean;
    originalHand?: HandID; // Reference to the hand this was split from
}

/**
 * Dealer hand
 */
export interface DealerHand {
    id: HandID;
    cards: Card[];
    values: number[];
    bestValue: number;
    status: HandStatus;
    hasHiddenCard: boolean;
}

/**
 * Hand comparison result
 */
export interface HandComparison {
    playerHand: Hand;
    dealerHand: DealerHand;
    result: HandResult;
    payout: number;
}

/**
 * Special hand combinations
 */
export interface HandCombination {
    name: string;
    description: string;
    check: (hand: Hand) => boolean;
    payout: number | ((bet: number) => number);
}

/**
 * Side bet hand types
 */
export enum SideBetHandType {
    PAIR = 'pair',
    COLORED_PAIR = 'coloredPair',
    PERFECT_PAIR = 'perfectPair',
    TWENTY_ONE_PLUS_THREE = '21+3',
    LUCKY_LADIES = 'luckyLadies',
    ROYAL_MATCH = 'royalMatch',
    STRAIGHT_FLUSH = 'straightFlush',
    THREE_OF_A_KIND = 'threeOfAKind'
}

/**
 * Hand calculation methods
 */
export interface HandCalculator {
    calculateValues: (cards: Card[]) => number[];
    determineBestValue: (values: number[]) => number;
    isBlackjack: (hand: Hand) => boolean;
    isBusted: (hand: Hand) => boolean;
    isSoft: (hand: Hand) => boolean;
    isPair: (hand: Hand) => boolean;
    getAvailableActions: (hand: Hand, dealerUpCard?: Card) => HandAction[];
}