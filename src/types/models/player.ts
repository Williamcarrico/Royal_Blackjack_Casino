/**
 * Player domain model types for Royal Blackjack Casino
 */

import { PlayerID, Balance } from '../branded';
import { Hand } from './hand';

/**
 * Player interface
 */
export interface Player {
    id: PlayerID;
    name: string;
    balance: Balance;
    hands: Hand[];
    currentBet: number;
    totalBet: number;
    winnings: number;
    position: number; // Position at the table
    isActive: boolean;
}

/**
 * Player statistics
 */
export interface PlayerStatistics {
    gamesPlayed: number;
    handsPlayed: number;
    winRate: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    highestBalance: number;
    lowestBalance: number;
    averageBet: number;
    largestWin: number;
    largestLoss: number;
    blackjacksCount: number;
    blackjackRate: number;
    bustCount: number;
    bustRate: number;
    insuranceTaken: number;
    insuranceWon: number;
    splitCount: number;
    doubleCount: number;
    surrenderCount: number;
}

/**
 * Player session
 */
export interface PlayerSession {
    id: string;
    playerId: PlayerID;
    startTime: Date;
    endTime?: Date;
    startingBalance: Balance;
    endingBalance?: Balance;
    gamesPlayed: number;
    handsPlayed: number;
    netProfit: number;
    totalWagered: number;
    totalWon: number;
    largestWin: number;
    largestLoss: number;
}

/**
 * Player self-exclusion settings
 */
export interface SelfExclusionSettings {
    enabled: boolean;
    endDate?: Date;
    dailyLimit?: number;
    weeklyLimit?: number;
    monthlyLimit?: number;
    maxBet?: number;
    timeoutDuration?: number;
    cooldownPeriod?: number;
}

/**
 * Player level
 */
export interface PlayerLevel {
    level: number;
    name: string;
    pointsRequired: number;
    benefits: string[];
    multiplier: number;
    icon: string;
}

/**
 * Player VIP status
 */
export interface PlayerVipStatus {
    isVip: boolean;
    level: number;
    points: number;
    pointsToNextLevel: number;
    benefits: string[];
    unlockDate?: Date;
    multiplier: number;
}