/**
 * Store-related type definitions for the blackjack game
 */
import { GameState, GameOptions, GameStatistics, GameVariant, Player } from './gameTypes';
import { Shoe, Card } from './cardTypes';
import { Hand, DealerHand } from './handTypes';
import { Bet, BettingStrategy, ProgressiveBetting, TableLimits } from './betTypes';

// Type for hand identifiers
export type HandId = { type: 'player'; id: string } | 'dealer';

// Side bet outcome types
export type SideBetOutcome = 'pending' | 'won' | 'lost';

// Side bet result interface
export interface SideBetResult {
    type: string;
    handId: string;
    playerId: string;
    outcome: SideBetOutcome;
    winningCombination?: string;
    payoutMultiplier: number;
    payout: number;
    originalBet: number;
}

// Game store state
export interface GameStore {
    gameState: GameState | null;
    isLoading: boolean;
    error: string | null;
    lastAction: string | null;
    userId: string | null;

    // User management
    setUserId: (userId: string | null) => void;
    loadUserChips: () => Promise<void>;

    // Game initialization
    initializeGame: (options?: GameOptions) => void;

    // Player actions
    placeBet: (playerId: string, amount: number) => void;
    dealCards: () => void;
    hit: (playerId: string, handId: string) => void;
    stand: (playerId: string, handId: string) => void;
    double: (playerId: string, handId: string) => void;
    split: (playerId: string, handId: string) => void;
    surrender: (playerId: string, handId: string) => void;
    insurance: (playerId: string, handId: string, amount: number) => void;

    // Game flow
    dealerPlay: () => void;
    settleRound: () => void;
    resetRound: () => void;
    endGame: () => void;
}

// Auth store state
export interface AuthStore {
    user: {
        id: string;
        name: string;
        email: string;
        balance: number;
        avatar?: string;
        isGuest: boolean;
    } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    continueAsGuest: (name?: string) => void;
    updateProfile: (data: Partial<AuthStore['user']>) => Promise<void>;
    addFunds: (amount: number) => Promise<void>;
    withdrawFunds: (amount: number) => Promise<void>;
}

// Settings store state
export interface SettingsStore {
    audioEnabled: boolean;
    volume: number;
    musicEnabled: boolean;
    musicVolume: number;
    animationSpeed: 'slow' | 'normal' | 'fast';
    tableColor: string;
    cardBack: string;
    chipStyle: string;
    language: string;
    currency: string;
    darkMode: boolean;
    autoStand17: boolean;
    showProbabilities: boolean;
    showBasicStrategy: boolean;
    confirmActions: boolean;

    // Actions
    updateSettings: (settings: Partial<Omit<SettingsStore, 'updateSettings'>>) => void;
    resetSettings: () => void;
    toggleAudio: () => void;
    toggleMusic: () => void;
    toggleDarkMode: () => void;
    toggleConfirmActions: () => void;
}

// Analytics store state
export interface AnalyticsStore {
    gamesPlayed: number;
    handsPlayed: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    winRate: number;
    blackjackRate: number;
    bustRate: number;
    averageBet: number;
    biggestWin: number;
    biggestLoss: number;
    streaks: {
        currentWinStreak: number;
        currentLoseStreak: number;
        longestWinStreak: number;
        longestLoseStreak: number;
    };
    history: {
        gameResults: Array<{
            gameId: string;
            timestamp: Date;
            profit: number;
            handsPlayed: number;
        }>;
        recentHands: Hand[];
        recentBets: Bet[];
    };

    // Actions
    recordGamePlayed: (gameResult: GameStatistics) => void;
    recordHand: (hand: Hand, result: string, profit: number) => void;
    recordBet: (bet: Bet) => void;
    resetStatistics: () => void;
}

// Deck slice state
export interface DeckSlice {
    shoe: Shoe | null;
    isShuffling: boolean;
    cardsDealt: number;

    // Actions
    createShoe: (numberOfDecks: number, penetration?: number) => void;
    shuffleShoe: () => void;
    drawCard: (isFaceUp?: boolean) => Card;
    burnCard: () => Card;
    setShoePosition: (position: number) => void;
    getCutCard: () => number;
    updateCutCard: (position: number) => void;
    hasReachedCutCard: () => boolean;
    resetShoe: () => void;
}

// Hand slice state
export interface HandSlice {
    playerHands: Hand[];
    dealerHand: DealerHand | null;
    activeHandIndex: number;

    // Actions
    createHand: (playerId: string, bet: number) => Hand;
    addCardToHand: (handId: string, card: Card) => void;
    addCardToDealerHand: (card: Card) => void;
    splitHand: (handId: string) => [Hand, Hand];
    evaluateHand: (handId: string) => number;
    getAvailableActions: (handId: string) => string[];
    clearHands: () => void;
    updateHand: (handId: HandId, updatedHandData: Partial<Hand | DealerHand>) => void;
    removeHand: (handId: string) => void;
}

// Bet slice state
export interface BetSlice {
    bets: Bet[];
    currentBet: number;
    minBet: number;
    maxBet: number;
    tableLimits: TableLimits;
    bettingStrategy: BettingStrategy | null;
    progressiveBetting: ProgressiveBetting;

    // Actions
    placeBet: (playerId: string, amount: number) => Bet;
    placeSideBet: (playerId: string, handId: string, type: string, amount: number) => Bet;
    updateBet: (betId: string, amount: number) => void;
    removeBet: (betId: string) => void;
    clearBets: () => void;
    settleBet: (betId: string, result: string) => number;
    calculateNextBet: () => number;
}

// Player slice state
export interface PlayerSlice {
    players: Player[];
    activePlayerIndex: number;

    // Actions
    addPlayer: (name: string, balance: number) => Player;
    removePlayer: (playerId: string) => void;
    updatePlayerBalance: (playerId: string, amount: number) => void;
    setActivePlayer: (index: number) => void;
    clearPlayers: () => void;
}

// Side bets store state
export interface SideBetsStore {
    availableSideBets: {
        name: string;
        description: string;
        minBet: number;
        maxBet: number;
        payouts: Partial<Record<string, number>>;
    }[];
    activeSideBets: {
        id: string;
        type: string;
        handId: string;
        playerId: string;
        amount: number;
        status: 'pending' | 'won' | 'lost';
        payout: number;
        payoutMultiplier?: number;
        winningCombination?: string;
        timestamp: Date;
    }[];
    sideBetHistory: Array<{
        id: string;
        type: string;
        handId: string;
        playerId: string;
        amount: number;
        status: 'won' | 'lost';
        payout: number;
        payoutMultiplier: number;
        winningCombination?: string;
        timestamp: Date;
    }>;
    sideBetStatistics: {
        totalSideBetsPlaced: number;
        totalSideBetAmount: number;
        sideBetWins: number;
        sideBetLosses: number;
        totalSideBetPayouts: number;
        netProfit: number;
        winRate: number;
        typeStats: Record<string, {
            betsPlaced: number;
            totalAmount: number;
            wins: number;
            losses: number;
            totalPayouts: number;
            roi: number;
        }>;
    };

    // Actions
    placeSideBet: (type: string, handId: string, playerId: string, amount: number) => string | undefined;
    evaluateSideBets: (dealerHand: DealerHand, playerHands: Hand[]) => SideBetResult[];
    clearSideBets: () => void;
    getRecommendedSideBets: (playerHand: Hand, dealerUpCard: Card) => Array<{ type: string, confidence: number }>;
    resetStatistics: () => void;
}

// Progressive betting store state
export interface ProgressiveBettingStore {
    strategy: BettingStrategy;
    isEnabled: boolean;
    baseBet: number;
    currentStage: number;
    progression: number[];
    history: {
        results: ('win' | 'loss')[];
        bets: number[];
    };

    // Actions
    enableProgressiveBetting: (strategy: BettingStrategy, baseBet: number) => void;
    disableProgressiveBetting: () => void;
    calculateNextBet: () => number;
    recordResult: (result: 'win' | 'loss') => void;
    resetProgression: () => void;
}

// Enhanced settings store state
export interface EnhancedSettingsStore extends SettingsStore {
    advancedRules: {
        dealerPeeks: boolean;
        surrenderAllowed: 'none' | 'early' | 'late';
        doubleAllowed: 'any2' | '9-11' | '10-11' | 'none';
        doubleAfterSplit: boolean;
        resplitAllowed: boolean;
        resplitAcesAllowed: boolean;
        hitSplitAces: boolean;
        maxSplits: number;
        maxHands: number;
        dealer17: 'stand' | 'hit';
    };
    countingSystem: 'none' | 'hi-lo' | 'hi-opt-i' | 'hi-opt-ii' | 'omega-ii' | 'red7' | 'zen';
    tableRules: Record<GameVariant, GameOptions>;

    // Actions
    updateAdvancedRules: (rules: Partial<EnhancedSettingsStore['advancedRules']>) => void;
    setCountingSystem: (system: EnhancedSettingsStore['countingSystem']) => void;
    updateVariantRules: (variant: GameVariant, options: Partial<GameOptions>) => void;
}

// Game session store state
export interface GameSessionStore {
    sessionId: string;
    startTime: Date;
    endTime: Date | null;
    duration: number; // in seconds
    initialBalance: number;
    finalBalance: number | null;
    profit: number | null;
    handsPlayed: number;
    roundsPlayed: number;
    avgBet: number;
    largestBet: number;
    largestWin: number;
    largestLoss: number;

    // Actions
    startSession: (initialBalance: number) => void;
    endSession: (finalBalance: number) => void;
    updateSessionStats: (stats: Partial<Omit<GameSessionStore, 'startSession' | 'endSession' | 'updateSessionStats'>>) => void;
    recordHand: (bet: number, result: string, profit: number) => void;
    recordRound: () => void;
}

// Game stats store state
export interface GameStatsStore {
    statistics: GameStatistics;
    history: {
        hands: Hand[];
        bets: Bet[];
        results: Array<{
            handId: string;
            result: string;
            payout: number;
        }>;
    };

    // Actions
    recordHand: (hand: Hand, result: string) => void;
    recordBet: (bet: Bet, result: string, payout: number) => void;
    updateStatistics: (stats: Partial<GameStatistics>) => void;
    resetStatistics: () => void;
    getWinRate: () => number;
    getAverageBet: () => number;
    getNetProfit: () => number;
}