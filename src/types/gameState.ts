/**
 * Game state type definitions
 */

export interface GameStats {
    // Basic stats
    handsPlayed: number;
    wins: number;
    losses: number;
    pushes: number;
    blackjacks: number;
    busts: number;

    // Betting stats
    startingChips: number;
    endingChips: number;
    netProfit: number;
    biggestWin: number;

    // Performance stats
    winRate: number;
    averageBet: number;

    // Game actions
    doubles: number;
    splits: number;
    surrenders: number;
    insuranceTaken: number;
}