'use client';

/**
 * Hook for managing Blackjack game state
 */
import { useCallback } from 'react';
import { create } from 'zustand';
import {
    GameState,
    GameOptions,
    GamePhase,
    Player,
} from '../../types/gameTypes';
import { Hand, HandAction } from '../../types/handTypes';
import { GameEngine } from '../../domains/game/gameEngine';

type GameStateStore = {
    gameState: GameState | null;
    gameEngine: GameEngine | null;
    isLoading: boolean;
    error: string | null;
    lastAction: string | null;

    initializeGame: (options: GameOptions) => void;
    placeBet: (playerId: string, amount: number) => void;
    dealCards: () => void;
    performAction: (playerId: string, handId: string, action: HandAction, amount?: number) => void;
    playDealerTurn: () => void;
    settleRound: () => void;
    nextRound: () => void;
    endGame: () => void;
};

const useGameStateStore = create<GameStateStore>((set, get) => ({
    gameState: null,
    gameEngine: null,
    isLoading: false,
    error: null,
    lastAction: null,

    initializeGame: (options: GameOptions) => {
        set({ isLoading: true, error: null });

        try {
            const gameEngine = new GameEngine(options);
            const gameState = gameEngine.getGameState();

            set({
                gameEngine,
                gameState,
                isLoading: false,
                lastAction: 'initializeGame'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to initialize game',
                isLoading: false
            });
        }
    },

    placeBet: (playerId: string, amount: number) => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.placeBet(playerId, amount);

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: 'placeBet'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to place bet',
                isLoading: false
            });
        }
    },

    dealCards: () => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.dealInitialCards();

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: 'dealCards'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to deal cards',
                isLoading: false
            });
        }
    },

    performAction: (playerId: string, handId: string, action: HandAction, amount?: number) => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.handlePlayerAction(playerId, handId, action, amount);

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: action
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : `Failed to perform ${action}`,
                isLoading: false
            });
        }
    },

    playDealerTurn: () => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.playDealerTurn();

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: 'playDealerTurn'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to play dealer turn',
                isLoading: false
            });
        }
    },

    settleRound: () => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.settleRound();

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: 'settleRound'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to settle round',
                isLoading: false
            });
        }
    },

    nextRound: () => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.nextRound();

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: 'nextRound'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to start next round',
                isLoading: false
            });
        }
    },

    endGame: () => {
        const { gameEngine } = get();

        if (!gameEngine) {
            set({ error: 'Game not initialized' });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            gameEngine.endGame();

            set({
                gameState: gameEngine.getGameState(),
                isLoading: false,
                lastAction: 'endGame'
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to end game',
                isLoading: false
            });
        }
    }
}));

/**
 * Hook for accessing and managing the game state
 * @returns Game state and functions to manage the game
 */
export function useGameState() {
    const {
        gameState,
        isLoading,
        error,
        lastAction,
        initializeGame,
        placeBet,
        dealCards,
        performAction,
        playDealerTurn,
        settleRound,
        nextRound,
        endGame
    } = useGameStateStore();

    const addPlayer = useCallback((name: string, balance: number): string | null => {
        try {
            const { gameEngine } = useGameStateStore.getState();
            if (!gameEngine) {
                throw new Error('Game not initialized');
            }

            const playerId = gameEngine.addPlayer(name, balance);
            useGameStateStore.setState({
                gameState: gameEngine.getGameState(),
                lastAction: 'addPlayer'
            });

            return playerId;
        } catch (error) {
            useGameStateStore.setState({
                error: error instanceof Error ? error.message : 'Failed to add player'
            });
            return null;
        }
    }, []);

    const hit = useCallback((playerId: string, handId: string) => {
        performAction(playerId, handId, 'hit');
    }, [performAction]);

    const stand = useCallback((playerId: string, handId: string) => {
        performAction(playerId, handId, 'stand');
    }, [performAction]);

    const double = useCallback((playerId: string, handId: string) => {
        performAction(playerId, handId, 'double');
    }, [performAction]);

    const split = useCallback((playerId: string, handId: string) => {
        performAction(playerId, handId, 'split');
    }, [performAction]);

    const surrender = useCallback((playerId: string, handId: string) => {
        performAction(playerId, handId, 'surrender');
    }, [performAction]);

    const insurance = useCallback((playerId: string, handId: string, amount: number) => {
        performAction(playerId, handId, 'insurance', amount);
    }, [performAction]);

    const getActiveHand = useCallback((): Hand | null => {
        if (!gameState) return null;

        const activePlayer = gameState.players[gameState.activePlayerIndex];
        if (!activePlayer) return null;

        return activePlayer.hands[gameState.activeHandIndex] || null;
    }, [gameState]);

    const getActivePlayer = useCallback((): Player | null => {
        if (!gameState) return null;

        return gameState.players[gameState.activePlayerIndex] || null;
    }, [gameState]);

    const getAvailableActions = useCallback((): HandAction[] => {
        const activeHand = getActiveHand();
        if (!activeHand) return [];

        return activeHand.actions;
    }, [getActiveHand]);

    const isGamePhase = useCallback((phase: GamePhase): boolean => {
        return gameState?.currentPhase === phase;
    }, [gameState]);

    const canPlaceBet = useCallback((): boolean => {
        if (!gameState) return false;

        return gameState.currentPhase === 'betting' &&
            gameState.status === 'running';
    }, [gameState]);

    return {
        gameState,
        isLoading,
        error,
        lastAction,
        // Initialization
        initializeGame,
        addPlayer,
        // Game flow
        placeBet,
        dealCards,
        hit,
        stand,
        double,
        split,
        surrender,
        insurance,
        playDealerTurn,
        settleRound,
        nextRound,
        endGame,
        // Helper functions
        getActiveHand,
        getActivePlayer,
        getAvailableActions,
        isGamePhase,
        canPlaceBet
    };
}

export default useGameState;