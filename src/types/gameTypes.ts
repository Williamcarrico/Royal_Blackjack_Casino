/**
 * Game-related type definitions for the blackjack game
 */
import { Card, Deck, Shoe } from './cardTypes';
import { Hand, DealerHand, HandAction } from './handTypes';
import { Bet, TableLimits, PayoutRules } from './betTypes';

// Card style options
export type CardStyleOption = 'modern' | 'classic' | 'minimal' | 'retro';

// Card back design options
export type CardBackOption = 'blue' | 'red' | 'abstract' | 'abstract_scene' | 'abstract_clouds' | 'astronaut' | 'cars' | 'castle' | 'fish' | 'frog';

// Game phases
export type GamePhase =
    | 'betting'    // Initial betting phase
    | 'dealing'    // Cards being dealt
    | 'playerTurn' // Player's turn to act
    | 'dealerTurn' // Dealer's turn to act
    | 'settlement' // Determining winners and payouts
    | 'cleanup';   // Preparing for next round

// Game status
export type GameStatus =
    | 'idle'       // Game not started
    | 'running'    // Game in progress
    | 'paused'     // Game paused
    | 'completed'; // Game completed

// Deck status tracking
export interface DeckStatus {
    deck: Deck;
    lastShuffled: Date;
    timesUsed: number;
    cardsDealt: number;
    isActive: boolean;
}

// Game variant
export type GameVariant =
    | 'classic'      // Standard blackjack
    | 'european'     // European rules
    | 'spanish21'    // Spanish 21
    | 'vegas'        // Las Vegas Strip rules
    | 'atlantic'     // Atlantic City rules
    | 'pontoon'      // British variant
    | 'doubleExposure' // Both dealer cards exposed
    | 'custom';      // Custom rules

// Game options
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
    allowedActions: HandAction[];
    availableSideBets: string[];
    deckRotationStrategy: 'perGame' | 'perShoe' | 'perSession';
}

// Player
export interface Player {
    id: string;
    name: string;
    balance: number;
    hands: Hand[];
    currentBet: number;
    totalBet: number;
    winnings: number;
    position: number; // Position at the table
    isActive: boolean;
}

// Game state
export interface GameState {
    id: string;
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

// Game round
export interface GameRound {
    id: string;
    roundNumber: number;
    playerHands: Hand[];
    dealerHand: DealerHand;
    bets: Bet[];
    results: {
        [handId: string]: {
            result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender';
            payout: number;
        };
    };
    startTime: Date;
    endTime?: Date;
    actions: GameAction[];
    originalDecks: Deck[]; // Reference to decks used in this round
    shuffledDuringRound: boolean;
}

// Game action
export interface GameAction {
    type: 'bet' | 'deal' | 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance' | 'shuffle';
    playerId: string;
    handId?: string;
    amount?: number;
    card?: Card;
    deckId?: string; // Reference to specific deck when relevant
    timestamp: Date;
}

// Game rules
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
    // Keep existing properties if needed
    variant?: GameVariant;
    description?: string;
    options?: GameOptions;
    getAvailableActions?: (hand: Hand, dealerUpCard?: Card) => HandAction[];
    isBlackjack?: (hand: Hand) => boolean;
    calculatePayout?: (bet: Bet, result: string) => number;
    dealerMustHitOn?: (dealerValue: number) => boolean;
    dealerMustStandOn?: (dealerValue: number) => boolean;
    shouldReshuffleDeck?: (deck: Deck) => boolean;
}

// Game statistics
export interface GameStatistics {
    handsPlayed: number;
    blackjacks: number;
    wins: number;
    losses: number;
    pushes: number;
    surrenders: number;
    busts: number;
    doubles: number;
    splits: number;
    insuranceTaken: number;
    winRate: number;
    averageBet: number;
    netProfit: number;
    biggestWin: number;
    biggestLoss: number;
    longestWinStreak: number;
    longestLoseStreak: number;
    deckUsageStats: {
        totalShuffles: number;
        averageCardsPerDeck: number;
        shufflesPerGame: number;
    };
}