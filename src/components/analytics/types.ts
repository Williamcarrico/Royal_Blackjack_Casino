export interface SkillMetric {
    category: string;
    level: string;
    score: number;
    trend?: number; // positive = improving, negative = declining
    description?: string;
}

export interface WinRateData {
    winRate: number;
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
    weeklyTrend?: number;
}

export interface Session {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    handsPlayed: number;
    netProfit: number;
    avgBet?: number;
}

export interface SessionMetrics {
    session?: {
        id: string;
        startTime: Date;
        handsPlayed: number;
        netProfit: number;
    };
    metrics?: {
        duration: number;
        averageBet: number;
        handsPerHour: number;
        profitPerHour: number;
        winRate: number;
    };
}

export interface PerformanceMetrics {
    totalProfit: number;
    streaks: {
        currentWinStreak: number;
        currentLoseStreak: number;
        longestWinStreak: number;
        longestLoseStreak: number;
    };
    skillMetrics: SkillMetric[];
    playerLevel: string;
    expectedValue: number;
    recentTrend?: number;
    bankrollStatus?: {
        status: 'increasing' | 'stable' | 'decreasing';
        riskOfRuin: number;
    };
}

export interface HeatMapEntry {
    playerValue: number;
    dealerCard: number;
    action: 'hit' | 'stand' | 'double' | 'split' | 'surrender';
    count: number;
    result: 'win' | 'loss' | 'push' | 'blackjack';
}

export interface ActionSuccessData {
    [key: string]: {
        success: number;
        count: number;
        optimal?: number; // how often the action was optimal
    };
}

export interface AggregatedHeatMapData {
    playerValue: number;
    action: string;
    wins: number;
    losses: number;
    total: number;
    winRate: number;
}

export interface Analytics {
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    handsPushed: number;
    blackjacks: number;
    blackjackRate: number;
    busts: number;
    doublesWon: number;
    splitsWon: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    averageBet: number;
    sessions: Session[];
    performanceMetrics: {
        actionSuccess: ActionSuccessData;
    };
    achievements?: {
        id: string;
        name: string;
        description: string;
        dateUnlocked: Date;
        icon: string;
    }[];
}

export interface DateRangeOption {
    label: string;
    value: string;
    days: number;
}

export type ChartMode = 'hands' | 'profit' | 'winRate';