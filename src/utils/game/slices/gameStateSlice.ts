'use client';

/**
 * Game State Slice
 *
 * Core game state management including game phases, status, and transitions
 */
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import type {
    GameState,
    GamePhase,
    GameStatus,
    GameVariant
} from '@/types/gameTypes';

// Define the GameStateSlice interface
interface GameStateSlice {
    // State
    gameId: string;
    gameState: GameState | null;
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    message: string | null;
    lastAction: string | null;
    gamePhase: GamePhase;
    gameStatus: GameStatus;
    roundNumber: number;
    gameVariant: GameVariant;
    gameRules: Record<string, any>;
    history: any[];

    // Actions
    setGamePhase: (phase: GamePhase) => void;
    setGameStatus: (status: GameStatus) => void;
    startRound: () => void;
    endRound: () => void;
    nextRound: () => void;
    trackAction: (action: string, data?: any) => void;
    setMessage: (message: string | null) => void;
}

/**
 * Creates the game state slice
 */
const createGameStateSlice: StateCreator<GameStateSlice> = (set, get) => ({
    // Core game state
    gameId: uuidv4(),
    gameState: null,
    isInitialized: false,
    isLoading: false,
    error: null,
    message: null,
    lastAction: null,
    gamePhase: 'betting',
    gameStatus: 'idle',
    roundNumber: 0,
    gameVariant: 'CLASSIC',
    gameRules: {},
    history: [],

    /**
     * Set the current game phase
     */
    setGamePhase: (phase: GamePhase) => {
        set({
            gamePhase: phase,
            lastAction: `phase_${phase}`
        });

        // Set appropriate messages based on the phase
        let message = null;
        switch (phase) {
            case 'betting':
                message = 'Place your bets to begin';
                break;
            case 'dealing':
                message = 'Dealing cards...';
                break;
            case 'playerTurn':
                message = 'Your turn - make your move';
                break;
            case 'dealerTurn':
                message = 'Dealer\'s turn';
                break;
            case 'settlement':
                message = 'Settling bets...';
                break;
            case 'completed':
                message = 'Round completed';
                break;
        }

        if (message) {
            set({ message });
        }
    },

    /**
     * Set the game status
     */
    setGameStatus: (status: GameStatus) => {
        set({
            gameStatus: status,
            lastAction: `status_${status}`
        });
    },

    /**
     * Start a new round
     */
    startRound: () => {
        const { roundNumber } = get();

        set({
            roundNumber: roundNumber + 1,
            gamePhase: 'dealing',
            gameStatus: 'running',
            lastAction: 'start_round'
        });
    },

    /**
     * End the current round
     */
    endRound: () => {
        // Capture the current state to add to history
        const historyEntry = {
            roundNumber: get().roundNumber,
            timestamp: new Date(),
            // Other state to capture can be added here
        };

        set(state => ({
            gamePhase: 'completed',
            lastAction: 'end_round',
            history: [...state.history, historyEntry]
        }));
    },

    /**
     * Advance to the next round
     */
    nextRound: () => {
        set({
            gamePhase: 'betting',
            lastAction: 'next_round'
        });
    },

    /**
     * Track a game action for history and analytics
     */
    trackAction: (action: string, data?: any) => {
        set({
            lastAction: action
        });

        // Could also store these actions in a more detailed history if needed
    },

    /**
     * Set a user-facing message
     */
    setMessage: (message: string | null) => {
        set({ message });
    }
});

export default createGameStateSlice;