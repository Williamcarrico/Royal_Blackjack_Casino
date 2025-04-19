/**
 * Betting domain model types for Royal Blackjack Casino
 */

import { BetID, HandID, BetAmount } from '../branded';
import { ChipValue, BetStatus, SideBetType } from '../enums';

/**
 * Represents a chip in the UI with its value and appearance properties
 */
export interface Chip {
    value: ChipValue;
    color: string;
    label: string;
    image?: string;
}

/**
 * Mapping between bet outcomes and their corresponding status values
 */
export const BetOutcomeStatus = {
    WIN: BetStatus.WON,
    LOSE: BetStatus.LOST,
    PUSH: BetStatus.PUSH,
    SURRENDER: BetStatus.SURRENDERED,
    CANCEL: BetStatus.CANCELLED
};

/**
 * Base bet interface that all bet types must implement
 */
export interface BaseBet {
    id: BetID;
    amount: BetAmount;
    status: BetStatus;
    timestamp: Date;
    payout?: number;
    payoutMultiplier?: number;
}

/**
 * Standard bet with hand association, the most common bet type
 */
export interface Bet extends BaseBet {
    handId: HandID;
}

/**
 * Insurance bet placed against dealer blackjack
 */
export interface InsuranceBet extends Bet {
    type: 'insurance';
    originalBetId: BetID;
}

/**
 * Side bet placed in addition to the main bet
 */
export interface SideBet extends Bet {
    type: SideBetType;
    originalBetId: BetID;
}

/**
 * Defines the betting limits for a table
 */
export interface TableLimits {
    minimumBet: number;
    maximumBet: number;
    minimumSideBet?: number;
    maximumSideBet?: number;
}

/**
 * Possible outcomes of a bet for statistical tracking
 */
export type BettingOutcome = 'win' | 'loss' | 'push' | 'blackjack' | 'surrender' | 'insurance';

/**
 * All supported betting strategy types
 */
export enum BettingStrategyType {
    FLAT = 'flat',
    MARTINGALE = 'martingale',
    PARLAY = 'parlay',
    FIBONACCI = 'fibonacci',
    OSCARS_GRIND = 'oscarsGrind',
    LABOUCHERE = 'labouchere',
    D_ALEMBERT = 'dAlembert',
    PAROLI = 'paroli',
    ONE_THREE_TWO_SIX = 'oneThreeTwoSix',
    D_ALEMBERT_ALT = 'd_alembert',
    OSCAR = 'oscar',
    CUSTOM = 'custom'
}

/**
 * Risk level for betting strategies
 */
export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

/**
 * Defines a betting strategy's behavior and properties
 */
export interface BettingStrategy {
    type: BettingStrategyType;
    name: string;
    description: string;
    getNextBet: (
        previousBets: Bet[],
        bankroll: number,
        tableLimits: TableLimits
    ) => number;
    risk: RiskLevel;
}

/**
 * Historical betting data and statistics
 */
export interface BettingHistory {
    bets: Bet[];
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    winRate: number;
    startingBankroll: number;
    currentBankroll: number;
}

/**
 * Defines payout multipliers for different winning conditions
 */
export interface PayoutRules {
    blackjack: number;  // Typically 1.5 (3:2) or 1.2 (6:5)
    regularWin: number; // Typically 1 (1:1)
    insurance: number;  // Typically 2 (2:1)
    surrender: number;  // Typically 0.5 (return half the bet)
    sideBets: Record<SideBetType, number | Record<string, number>>;
}

/**
 * Configuration for progressive betting strategies
 */
export interface ProgressiveBetting {
    enabled: boolean;
    baseBet: number;
    winProgression: number; // Multiplier after win
    lossProgression: number; // Multiplier after loss
    maxProgressionSteps: number;
    resetCondition: 'win' | 'loss' | 'sessions' | 'custom';
}