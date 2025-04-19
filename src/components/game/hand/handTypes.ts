/**
 * Hand-related type definitions for the blackjack game
 */
import { Card } from './cardTypes';

// Hand status
export type HandStatus =
    | 'active'    // Currently being played
    | 'standing'  // Player has stood
    | 'busted'    // Hand value exceeds 21
    | 'blackjack' // Natural blackjack (first two cards totaling 21)
    | 'surrender' // Player has surrendered
    | 'push'      // Tie with dealer
    | 'win'       // Won against dealer
    | 'loss';     // Lost to dealer

// Hand result (after comparison with dealer)
export type HandResult =
    | 'win'       // Normal win (1:1)
    | 'blackjack' // Blackjack win (3:2 or 6:5 depending on rules)
    | 'push'      // Tie
    | 'loss'      // Loss
    | 'surrender' // Surrendered (lose half bet)
    | 'insurance' // Insurance paid (2:1)
    | 'pending';  // Not resolved yet

// Available actions for a hand
export type HandAction =
    | 'hit'       // Take another card
    | 'stand'     // End turn with current cards
    | 'double'    // Double bet and take one card
    | 'split'     // Split pairs into two hands
    | 'surrender' // Surrender and lose half bet
    | 'insurance'; // Take insurance against dealer blackjack

// Player hand
export interface Hand {
    id: string;
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
    originalHand?: string; // Reference to the hand this was split from
}

// Dealer hand
export interface DealerHand {
    id: string;
    cards: Card[];
    values: number[];
    bestValue: number;
    status: HandStatus;
    hasHiddenCard: boolean;
}

// Hand comparison result
export interface HandComparison {
    playerHand: Hand;
    dealerHand: DealerHand;
    result: HandResult;
    payout: number;
}

// Special hand combinations
export interface HandCombination {
    name: string;
    description: string;
    check: (hand: Hand) => boolean;
    payout: number | ((bet: number) => number);
}

// Side bet hand types
export type SideBetHandType =
    | 'pair'           // First two cards are a pair
    | 'coloredPair'    // First two cards are a pair of the same color
    | 'perfectPair'    // First two cards are a pair of the same suit
    | '21+3'           // First two cards plus dealer's up card form a poker hand
    | 'luckyLadies'    // Hand contains a queen of hearts
    | 'royalMatch'     // First two cards are the same suit
    | 'straightFlush'  // Hand forms a straight flush
    | 'threeOfAKind';  // Hand forms three of a kind

// Hand calculation methods
export interface HandCalculator {
    calculateValues: (cards: Card[]) => number[];
    determineBestValue: (values: number[]) => number;
    isBlackjack: (hand: Hand) => boolean;
    isBusted: (hand: Hand) => boolean;
    isSoft: (hand: Hand) => boolean;
    isPair: (hand: Hand) => boolean;
    getAvailableActions: (hand: Hand, dealerUpCard?: Card) => HandAction[];
}