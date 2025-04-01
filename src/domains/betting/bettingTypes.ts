// src/domains/betting/bettingTypes.ts
// Purpose: Defines types related to betting activities in the game.

import { Bet as BetType, BetStatus, TableLimits } from '../../types/betTypes';

/**
 * Represents a single bet placed by a player for a round or hand.
 * Extended from the base Bet type with domain-specific properties.
 */
export interface Bet {
    playerId: string;
    amount: number;
    handId?: string;
    timestamp: number; // When the bet was placed (as Unix timestamp)
    status?: BetStatus;
    payout?: number;
    payoutMultiplier?: number;
    // Optional: Could specify bet type if there are multiple
    type?: 'main' | 'insurance' | 'side';
}

/**
 * Represents the outcome of a bet.
 * Maps to the BetStatus in betTypes.ts but focused on final outcomes only.
 */
export const BetOutcome = {
    WIN: 'won',
    LOSE: 'lost',
    PUSH: 'push',
    BLACKJACK: 'blackjack',
    SURRENDER: 'surrendered',
} as const;

export type BetOutcome = typeof BetOutcome[keyof typeof BetOutcome];

/**
 * Maps the domain BetOutcome to the system BetStatus
 */
export const mapOutcomeToStatus = (outcome: BetOutcome): BetStatus => {
    switch (outcome) {
        case BetOutcome.WIN:
            return 'won';
        case BetOutcome.LOSE:
            return 'lost';
        case BetOutcome.PUSH:
            return 'push';
        case BetOutcome.SURRENDER:
            return 'surrendered';
        // Blackjack is a special win condition
        case BetOutcome.BLACKJACK:
            return 'won';
        default:
            return 'pending';
    }
};

/**
 * Interface for defining the structure of betting strategy functions.
 * They take context (like current balance, maybe bet history) and return the next bet amount.
 */
export interface BettingStrategyContext {
    currentBalance: number;
    minBet: number; // Maps to tableLimits.minimumBet
    maxBet: number; // Maps to tableLimits.maximumBet
    lastBet?: {
        amount: number;
        outcome: BetOutcome;
        payout?: number;
    };
    previousBets?: Bet[];
    // Could add bet history, win/loss streak, etc.
}

/**
 * Function type for betting strategies that determines the next bet amount
 * based on the provided context.
 */
export type BettingStrategyFunction = (context: BettingStrategyContext) => number;

/**
 * Structure to hold parameters for specific betting strategies.
 */
export interface MartingaleConfig {
    baseBet: number;
    maxSteps?: number; // Maximum number of doubles
}

export interface FixedBetConfig {
    betAmount: number;
}

export interface FibonacciConfig {
    baseBet: number;
    maxStep?: number; // Maximum position in sequence
}

export interface DAlembertConfig {
    baseBet: number;
    unitSize?: number; // Size of one unit (defaults to baseBet)
}

export interface OscarsGrindConfig {
    baseBet: number;
    targetProfit?: number; // Target profit (defaults to 1 unit)
}

export interface ParlayConfig {
    baseBet: number;
    maxConsecutiveWins?: number; // Maximum consecutive wins before reset
}

// Union type for different strategy configurations
export type BettingStrategyConfig =
    | MartingaleConfig
    | FixedBetConfig
    | FibonacciConfig
    | DAlembertConfig
    | OscarsGrindConfig
    | ParlayConfig
    | Record<string, unknown>; // Allow custom configurations

/**
 * Converts the domain-specific BettingStrategyContext to the format
 * expected by the existing codebase's strategy functions
 */
export const adaptStrategyContext = (
    context: BettingStrategyContext
): { previousBets: BetType[], bankroll: number, tableLimits: TableLimits } => {
    const { currentBalance, minBet, maxBet, previousBets = [] } = context;

    // Adapt to the format expected by existing strategy functions
    return {
        previousBets: previousBets.map(bet => ({
            id: bet.handId ?? '',
            amount: bet.amount,
            status: bet.status ?? 'pending',
            handId: bet.handId ?? '',
            timestamp: new Date(bet.timestamp),
            payout: bet.payout,
            payoutMultiplier: bet.payoutMultiplier
        })),
        bankroll: currentBalance,
        tableLimits: {
            minimumBet: minBet,
            maximumBet: maxBet
        }
    };
};