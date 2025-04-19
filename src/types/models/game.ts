/**
 * Game domain model types for Royal Blackjack Casino
 */

import {
    GameID,
    DeckID,
    PlayerID,
    HandID
} from '../branded';
import {
    GamePhase,
    GameStatus,
    CardStyleOption
} from '../enums';
import { Card, Deck, Shoe } from './card';
import { Player } from './player';
import { DealerHand } from './hand';
import { TableLimits, PayoutRules } from './bet';

/**
 * Game variant options
 */
export enum GameVariant {
    CLASSIC = 'classic',
    EUROPEAN = 'european',
    SPANISH21 = 'spanish21',
    VEGAS = 'vegas',
    ATLANTIC = 'atlantic',
    PONTOON = 'pontoon',
    DOUBLE_EXPOSURE = 'doubleExposure',
    CUSTOM = 'custom'
}

/**
 * Deck status tracking
 */
export interface DeckStatus {
    deck: Deck;
    lastShuffled: Date;
    timesUsed: number;
    cardsDealt: number;
    isActive: boolean;
}

/**
 * Game options
 */
export interface GameOptions {
    variant: GameVariant;
    numberOfDecks: number;
    dealerHitsSoft17: boolean;
    blackjackPays: 1.5 | 1.2; // 3:2 or 6:5
    doubleAfterSplit: boolean;
    resplitAces: boolean;
    lateSurrender: boolean;
    maxSplitHands: number;
    penetration: number; // Percentage of shoe dealt before reshuffling
    tableLimits: TableLimits;
    payoutRules: PayoutRules;
    allowedActions: string[];
    availableSideBets: string[];
    deckRotationStrategy: 'perGame' | 'perShoe' | 'perSession';
}

/**
 * Game state
 */
export interface GameState {
    id: GameID;
    status: GameStatus;
    currentPhase: GamePhase;
    shoe: Shoe;
    decks: DeckStatus[]; // Track individual decks
    dealer: {
        hand: DealerHand;
        isRevealed: boolean;
    };
    players: Player[];
    activePlayerIndex: number;
    activeHandIndex: number;
    options: GameOptions;
    roundNumber: number;
    timestamp: Date;
    history: GameRound[];
    lastShuffle: Date; // Last time the shoe was shuffled
    deckPenetration: number; // Current penetration percentage
}

/**
 * Game round
 */
export interface GameRound {
    id: string;
    roundNumber: number;
    playerHands: HandID[];
    dealerHand: HandID;
    bets: string[];
    results: {
        [handId: string]: {
            result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender';
            payout: number;
        };
    };
    startTime: Date;
    endTime?: Date;
    actions: GameAction[];
    originalDecks: DeckID[]; // Reference to decks used in this round
    shuffledDuringRound: boolean;
}

/**
 * Game action
 */
export interface GameAction {
    type: 'bet' | 'deal' | 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance' | 'shuffle';
    playerId: PlayerID;
    handId?: HandID;
    amount?: number;
    card?: Card;
    deckId?: DeckID; // Reference to specific deck when relevant
    timestamp: Date;
}

/**
 * Game rules
 */
export interface GameRules {
    decksCount: number;
    dealerHitsSoft17: boolean;
    blackjackPayout: number;
    doubleAllowed: boolean;
    doubleAfterSplit: boolean;
    surrender: boolean;
    insuranceAvailable: boolean;
    maxSplits: number;
    resplitAces: boolean;
    hitSplitAces: boolean;
    variant?: GameVariant;
    description?: string;
}