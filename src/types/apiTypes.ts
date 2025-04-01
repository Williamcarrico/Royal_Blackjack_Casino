/**
 * API-related type definitions for the blackjack game
 */
import { GameState, GameAction, GameOptions, GameVariant } from './gameTypes';
import { Bet, SideBetType } from './betTypes';
import { Hand, HandAction } from './handTypes';
import { Card } from './cardTypes';

// API response status
export type ApiStatus = 'success' | 'error';

// Base API response
export interface ApiResponse {
    status: ApiStatus;
    message?: string;
    timestamp: string;
}

// Error response
export interface ErrorResponse extends ApiResponse {
    status: 'error';
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

// Generic success response with data
export interface SuccessResponse<T> extends ApiResponse {
    status: 'success';
    data: T;
}

// Game creation request
export interface CreateGameRequest {
    variant: GameVariant;
    options?: Partial<GameOptions>;
    playerNames?: string[];
    initialBalance?: number;
}

// Game creation response
export interface CreateGameResponse extends SuccessResponse<{
    gameId: string;
    gameState: GameState;
}> { }

// Place bet request
export interface PlaceBetRequest {
    gameId: string;
    playerId: string;
    amount: number;
    sideBets?: Array<{
        type: SideBetType;
        amount: number;
    }>;
}

// Place bet response
export interface PlaceBetResponse extends SuccessResponse<{
    bet: Bet;
    playerBalance: number;
    gameState: GameState;
}> { }

// Game action request
export interface GameActionRequest {
    gameId: string;
    playerId: string;
    handId: string;
    action: HandAction;
    amount?: number; // For double, bet amount
}

// Game action response
export interface GameActionResponse extends SuccessResponse<{
    action: GameAction;
    hand?: Hand;
    card?: Card;
    gameState: GameState;
}> { }

// Game state request
export interface GetGameStateRequest {
    gameId: string;
}

// Game state response
export interface GetGameStateResponse extends SuccessResponse<{
    gameState: GameState;
}> { }

// Leaderboard entry
export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    winnings: number;
    handsPlayed: number;
    winRate: number;
    largestWin: number;
    timestamp: string;
}

// Leaderboard response
export interface LeaderboardResponse extends SuccessResponse<{
    entries: LeaderboardEntry[];
    timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime';
}> { }

// Player statistics request
export interface PlayerStatsRequest {
    playerId: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'allTime';
}

// Player statistics response
export interface PlayerStatsResponse extends SuccessResponse<{
    playerId: string;
    playerName: string;
    statistics: {
        handsPlayed: number;
        winRate: number;
        totalWinnings: number;
        averageBet: number;
        blackjackRate: number;
        bustRate: number;
        doubleSuccessRate: number;
        splitSuccessRate: number;
        insuranceSuccessRate: number;
    };
    history: Array<{
        gameId: string;
        timestamp: string;
        netWinnings: number;
        handsPlayed: number;
    }>;
}> { }

// Game history request
export interface GameHistoryRequest {
    gameId: string;
}

// Game history response
export interface GameHistoryResponse extends SuccessResponse<{
    gameId: string;
    startTime: string;
    endTime?: string;
    variant: GameVariant;
    players: Array<{
        playerId: string;
        playerName: string;
        finalBalance: number;
        netWinnings: number;
    }>;
    rounds: Array<{
        roundNumber: number;
        actions: GameAction[];
        results: Record<string, {
            playerId: string;
            handId: string;
            result: string;
            payout: number;
        }>;
    }>;
}> { }

// Available games response
export interface AvailableGamesResponse extends SuccessResponse<{
    games: Array<{
        id: string;
        variant: GameVariant;
        players: number;
        status: string;
        createdAt: string;
    }>;
}> { }

// Websocket message types
export type WebSocketMessageType =
    | 'gameState'    // Game state update
    | 'playerAction' // Player performed action
    | 'dealerAction' // Dealer performed action
    | 'bet'          // Bet placed
    | 'result'       // Hand result determined
    | 'error'        // Error occurred
    | 'chat';        // Chat message

// Websocket message
export interface WebSocketMessage<T = unknown> {
    type: WebSocketMessageType;
    gameId: string;
    timestamp: string;
    data: T;
}