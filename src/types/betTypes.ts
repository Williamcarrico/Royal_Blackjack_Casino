/**
 * Betting-related type definitions for the blackjack game
 */

// Chip values
export type ChipValue = 1 | 5 | 10 | 20 | 25 | 50 | 100 | 500 | 1000;

// Chip appearance
export interface Chip {
    value: ChipValue;
    color: string;
    label: string;
    image?: string;
}

// Bet status
export type BetStatus =
    | 'pending'   // Bet placed but round not started
    | 'active'    // Round in progress
    | 'won'       // Bet won
    | 'lost'      // Bet lost
    | 'push'      // Bet tied
    | 'cancelled' // Bet cancelled
    | 'surrendered'; // Hand surrendered

// Basic bet
export interface Bet {
    id: string;
    amount: number;
    status: BetStatus;
    handId: string;
    timestamp: Date;
    payout?: number;
    payoutMultiplier?: number;
}

// Insurance bet
export interface InsuranceBet extends Bet {
    type: 'insurance';
    originalBetId: string;
}

// Side bet types
export type SideBetType =
    | 'perfectPairs'
    | '21+3'
    | 'luckyLadies'
    | 'royalMatch'
    | 'luckyLucky'
    | 'inBetween'
    | 'overUnder13';

// Side bet
export interface SideBet extends Bet {
    type: SideBetType;
    originalBetId: string;
}

// Table limits
export interface TableLimits {
    minimumBet: number;
    maximumBet: number;
    minimumSideBet?: number;
    maximumSideBet?: number;
}

// Betting outcome type
export type BettingOutcome = 'win' | 'loss' | 'push' | 'blackjack' | 'surrender' | 'insurance';

// Betting strategy types
export type BettingStrategyType =
    | 'flat'           // Same bet every time
    | 'martingale'     // Double after loss
    | 'parlay'         // Let winnings ride
    | 'fibonacci'      // Follow fibonacci sequence
    | 'oscarsGrind'    // Incremental recovery
    | 'labouchere'     // Cancellation system
    | 'dAlembert'      // Gradual progression
    | 'paroli'         // Positive progression
    | 'oneThreeTwoSix' // 1-3-2-6 progression
    | 'd_alembert'     // D'Alembert system
    | 'oscar'          // Oscar's Grind
    | 'custom';        // Custom strategy

// Betting strategy
export interface BettingStrategy {
    type: BettingStrategyType;
    name: string;
    description: string;
    getNextBet: (
        previousBets: Bet[],
        bankroll: number,
        tableLimits: TableLimits
    ) => number;
    risk: 'low' | 'medium' | 'high';
}

// Betting history
export interface BettingHistory {
    bets: Bet[];
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    winRate: number;
    startingBankroll: number;
    currentBankroll: number;
}

// Payout rules
export interface PayoutRules {
    blackjack: number;  // Typically 1.5 (3:2) or 1.2 (6:5)
    regularWin: number; // Typically 1 (1:1)
    insurance: number;  // Typically 2 (2:1)
    surrender: number;  // Typically 0.5 (return half the bet)
    sideBets: Record<SideBetType, number | Record<string, number>>;
}

// Progressive betting factors
export interface ProgressiveBetting {
    enabled: boolean;
    baseBet: number;
    winProgression: number; // Multiplier after win
    lossProgression: number; // Multiplier after loss
    maxProgressionSteps: number;
    resetCondition: 'win' | 'loss' | 'sessions' | 'custom';
}