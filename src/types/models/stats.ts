/**
 * Statistics domain model types for Royal Blackjack Casino
 */

/**
 * Game statistics
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

/**
 * Detailed game statistics
 */
export interface DetailedGameStatistics extends GameStats {
    gamesPlayed: number;
    blackjackRate: number;
    bustRate: number;
    insuranceWon: number;
    insuranceRate: number;
    totalWagered: number;
    totalWon: number;
    averageHandsPerGame: number;
    longestWinStreak: number;
    longestLoseStreak: number;
    currentStreak: number;
    deckPenetration: number;
    deckUsageStats: {
        totalShuffles: number;
        averageCardsPerDeck: number;
        shufflesPerGame: number;
    };
}

/**
 * Session statistics
 */
export interface SessionStats {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number; // in minutes
    gameStats: GameStats;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    startingBalance: number;
    endingBalance: number;
    biggestWin: number;
    biggestLoss: number;
    averageBet: number;
    handsPerHour: number;
}

/**
 * Strategy performance statistics
 */
export interface StrategyStats {
    name: string;
    handsPlayed: number;
    winRate: number;
    netProfit: number;
    roi: number; // Return on investment
    variance: number;
    expectedValue: number;
    optimalUsage: number; // Percentage of optimal decisions made
    deviations: number; // Number of deviations from basic strategy
}

/**
 * Card counting statistics
 */
export interface CountingStats {
    system: string;
    runningCount: number;
    trueCount: number;
    decksRemaining: number;
    bettingCorrelation: number;
    playingEfficiency: number;
    insuranceCorrelation: number;
    winRateWithCount: number;
    winRateWithoutCount: number;
    advantagePlayed: number; // Percentage of hands played with player advantage
}

/**
 * Time-based performance statistics
 */
export interface TimeStats {
    daily: {
        date: Date;
        handsPlayed: number;
        netProfit: number;
        winRate: number;
    }[];
    weekly: {
        weekStarting: Date;
        handsPlayed: number;
        netProfit: number;
        winRate: number;
    }[];
    monthly: {
        month: string;
        handsPlayed: number;
        netProfit: number;
        winRate: number;
    }[];
}

/**
 * Overall player statistics
 */
export interface OverallPlayerStats {
    gameStats: DetailedGameStatistics;
    sessionStats: SessionStats[];
    strategyStats: Record<string, StrategyStats>;
    timeStats: TimeStats;
    countingStats?: CountingStats;
    lastUpdated: Date;
}