'use client';

/**
 * useGameState.ts
 *
 * Provides a simplified interface for accessing the game state store
 * and handling game-related actions
 */
import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/utils/game/gameStore';
import type { HandAction } from '@/components/game/hand/handTypes';
import type { GamePhase, Player as PlayerType } from '@/types/gameTypes';

// Type definitions for the hook's internal use
type Player = PlayerType;
type Hand = {
    id: string;
    bet: number;
    cards: unknown[];
    values: number[];
    status: string;
    isDoubled: boolean;
    isSplit: boolean;
    [key: string]: unknown;
};

// Define store types
interface GameStoreType {
    gameState: {
        currentPhase?: string;
        status?: string;
        roundNumber?: number;
        options?: Record<string, unknown>;
    };
    players?: Player[];
    activePlayerId?: string;
    playerHands?: Hand[];
    dealerHand?: unknown;
    activeHandIndex?: number;
    bets?: unknown[];
    currentBet?: number;
    isLoading?: boolean;
    error?: string | null;
    [key: string]: unknown;
}

/**
 * Hook for accessing and manipulating game state
 */
export function useGameState() {
    // Get the raw store with proper type
    const store = useGameStore() as unknown as GameStoreType;

    // Extract game state and needed properties with safe fallbacks
    const gameState = store.gameState || {};
    const gamePhase = (gameState.currentPhase || 'idle') as GamePhase;
    const gameStatus = gameState.status || 'idle';
    const roundNumber = gameState.roundNumber || 0;
    const gameRules = gameState.options || null;
    const isLoading = !!store.isLoading;
    const error = store.error || null;
    const message = store.error || '';

    // Access player data with useMemo to avoid dependency changes
    const players = useMemo<Player[]>(() => store.players ?? [], [store.players]);
    const activePlayerId = useMemo(() => store.activePlayerId || '', [store.activePlayerId]);
    const activePlayerIndex = useMemo(
        () => players.findIndex(p => p.id === activePlayerId),
        [players, activePlayerId]
    );

    // Use useMemo for playerHands and other derived state
    const playerHands = useMemo<Hand[]>(() => store.playerHands ?? [], [store.playerHands]);
    const dealerHand = store.dealerHand || null;
    const activeHandIndex = store.activeHandIndex || 0;

    // Access betting data
    const bets = store.bets || [];
    const currentBet = store.currentBet || 0;

    /**
     * Get the active player
     */
    const getActivePlayer = useCallback(() => {
        return players[activePlayerIndex] || null;
    }, [players, activePlayerIndex]);

    /**
     * Get the active hand
     */
    const getActiveHand = useCallback(() => {
        const activePlayer = getActivePlayer();
        if (!activePlayer) return null;

        return playerHands[activeHandIndex] || null;
    }, [getActivePlayer, playerHands, activeHandIndex]);

    /**
     * Check if a specific action is available for the active hand
     */
    const isActionAvailable = useCallback((action: HandAction): boolean => {
        const activeHand = getActiveHand();
        if (!activeHand || typeof store.getAvailableActions !== 'function') return false;

        const availableActions = store.getAvailableActions(activeHand.id);
        return Array.isArray(availableActions) && availableActions.includes(action);
    }, [getActiveHand, store]);

    /**
     * Deal initial cards to start a round
     */
    const dealCards = useCallback(() => {
        if (gamePhase !== 'betting') {
            return false;
        }

        try {
            if (typeof store.dealCards === 'function') {
                return store.dealCards();
            }
            return false;
        } catch (error) {
            console.error('Error dealing cards:', error);
            return false;
        }
    }, [gamePhase, store]);

    /**
     * Perform a player action (hit, stand, double, split, surrender)
     */
    const performAction = useCallback((action: HandAction) => {
        const activeHand = getActiveHand();
        const activePlayer = getActivePlayer();

        if (!activeHand || !activePlayer || gamePhase !== 'playerTurn') {
            return false;
        }

        if (!isActionAvailable(action)) {
            return false;
        }

        try {
            const actionMethod = store[action];
            if (typeof actionMethod === 'function') {
                return actionMethod(activePlayer.id, activeHand.id);
            }
            return false;
        } catch (error) {
            console.error(`Error performing action ${action}:`, error);
            return false;
        }
    }, [gamePhase, getActiveHand, isActionAvailable, getActivePlayer, store]);

    /**
     * Convenience methods for common player actions
     */
    const hit = useCallback(() => performAction('hit'), [performAction]);
    const stand = useCallback(() => performAction('stand'), [performAction]);
    const double = useCallback(() => performAction('double'), [performAction]);
    const split = useCallback(() => performAction('split'), [performAction]);
    const surrender = useCallback(() => performAction('surrender'), [performAction]);
    const insurance = useCallback(() => performAction('insurance'), [performAction]);

    /**
     * Play the dealer's turn
     */
    const playDealerTurn = useCallback(() => {
        if (gamePhase !== 'playerTurn' && gamePhase !== 'dealerTurn') {
            return false;
        }

        try {
            if (typeof store.dealerPlay === 'function') {
                return store.dealerPlay();
            }
            return false;
        } catch (error) {
            console.error('Error playing dealer turn:', error);
            return false;
        }
    }, [gamePhase, store]);

    /**
     * Settle bets for the current round
     */
    const settleRound = useCallback(() => {
        if (gamePhase !== 'settlement') {
            return false;
        }

        try {
            if (typeof store.settleRound === 'function') {
                return store.settleRound();
            }
            return false;
        } catch (error) {
            console.error('Error settling round:', error);
            return false;
        }
    }, [gamePhase, store]);

    /**
     * Go to next round
     */
    const nextRound = useCallback(() => {
        try {
            if (typeof store.resetRound === 'function') {
                return store.resetRound();
            }
            return false;
        } catch (error) {
            console.error('Error moving to next round:', error);
            return false;
        }
    }, [store]);

    /**
     * Check if a specific game phase is active
     */
    const isGamePhase = useCallback((phase: GamePhase): boolean => {
        return gamePhase === phase;
    }, [gamePhase]);

    /**
     * Check if bets can be placed
     */
    const canPlaceBet = useCallback((): boolean => {
        return gamePhase === 'betting' && gameStatus === 'running';
    }, [gamePhase, gameStatus]);

    /**
     * Initialize the game
     */
    const initializeGame = useCallback((options?: Record<string, unknown>) => {
        if (typeof store.initializeGame === 'function') {
            return store.initializeGame(options);
        }
        return false;
    }, [store]);

    /**
     * Reset the game
     */
    const resetGame = useCallback(() => {
        if (typeof store.resetGame === 'function') {
            return store.resetGame();
        }
        return false;
    }, [store]);

    /**
     * Place a bet
     */
    const placeBet = useCallback((playerId: string, amount: number) => {
        if (typeof store.placeBet === 'function') {
            return store.placeBet(playerId, amount);
        }
        return null;
    }, [store]);

    /**
     * Add a player
     */
    const addPlayer = useCallback((name: string, balance: number) => {
        if (typeof store.addPlayer === 'function') {
            return store.addPlayer(name, balance);
        }
        return null;
    }, [store]);

    /**
     * Clear any errors
     */
    const clearError = useCallback(() => {
        if (typeof store.clearError === 'function') {
            return store.clearError();
        }
        return false;
    }, [store]);

    // Return the relevant state and actions
    return {
        // State
        gamePhase,
        gameStatus,
        isLoading,
        error,
        message,
        roundNumber,
        gameRules,

        // Game flow
        initializeGame,
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
        resetGame,

        // Player and hand access
        players,
        playerHands,
        dealerHand,
        getActivePlayer,
        getActiveHand,
        addPlayer,

        // Betting
        bets,
        currentBet,
        placeBet,

        // Helper functions
        isGamePhase,
        canPlaceBet,
        isActionAvailable,
        clearError
    };
}