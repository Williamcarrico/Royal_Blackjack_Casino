/**
 * Hook for using the Game service with React
 */
import { useState, useEffect, useCallback } from 'react';
import { useService, getTypedService } from './useService';
import GameService from '../../services/api/gameService';
import EventTracker from '../../services/analytics/eventTracker';
import { ServiceError } from '../../services/serviceInterface';
import ServiceManager from '../../services/serviceRegistry';
import { GameVariant, GameOptions } from '../../types/gameTypes';
import { HandAction } from '../../types/handTypes';

// Define game-related interfaces
interface GameState {
    currentGame: {
        id: string;
        hands?: Record<string, { id: string }>;
    } | null;
    gameHistory: Array<{
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
        rounds: Array<Record<string, unknown>>;
    }>;
    isLoading: boolean;
    error: ServiceError | null;
}

export default function useGameService() {
    const {
        service: gameService,
        isLoading: _serviceLoading,
        error: serviceError
    } = useService<GameService>('game');

    const [gameState, setGameState] = useState<GameState>({
        currentGame: null,
        gameHistory: [],
        isLoading: false,
        error: null
    });

    // Update state if there's a service error
    useEffect(() => {
        if (serviceError) {
            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error: serviceError
            }));
        }
    }, [serviceError]);

    /**
     * Create a new game
     */
    const createGame = useCallback(async (options: Partial<{
        variant: GameVariant;
        gameOptions?: Partial<GameOptions>;
        playerNames?: string[];
        initialBalance?: number;
        type?: string;
        tableType?: string;
        betMin?: number;
        betMax?: number;
    }> = {}) => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Ensure variant is provided with default value if needed
            const gameOptions = {
                variant: options.variant || 'classic' as GameVariant,
                gameOptions: options.gameOptions,
                playerNames: options.playerNames,
                initialBalance: options.initialBalance
            };

            const newGame = await gameService.createGame(gameOptions);

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: newGame.gameId,
                    hands: {}
                },
                isLoading: false
            }));

            // Track game creation in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('game', 'game_created', {
                    gameId: newGame.gameId,
                    gameType: options.type || 'standard',
                    tableType: options.tableType || 'standard',
                    betMin: options.betMin,
                    betMax: options.betMax
                });
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: newGame };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to create game',
                    'game_creation_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService]);

    /**
     * Load an existing game
     */
    const loadGame = useCallback(async (gameId: string) => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Use joinGame as a substitute for getGame since it returns the current game state
            const gameState = await gameService.joinGame(gameId, 'Player');

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: gameId,
                    hands: {}
                },
                isLoading: false
            }));

            // Track game loading in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('game', 'game_loaded', {
                    gameId,
                    gameType: gameState.options.variant
                });
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: { id: gameId, gameState } };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to load game',
                    'game_load_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService]);

    /**
     * Load game history
     */
    const loadGameHistory = useCallback(async (_limit = 10) => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Mock history response until API is implemented
            const history = await Promise.resolve([]);

            setGameState(prev => ({
                ...prev,
                gameHistory: history,
                isLoading: false
            }));

            return { success: true, history };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to load game history',
                    'game_history_load_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService]);

    /**
     * Place a bet
     */
    const placeBet = useCallback(async (amount: number, position: string = 'main') => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        if (!gameState.currentGame) {
            throw new Error('No active game');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Adapt to the actual API by passing required parameters
            const updatedGame = await gameService.placeBet(
                gameState.currentGame.id,
                'player1', // This should be replaced with the actual player ID
                amount
            );

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: gameState.currentGame!.id,
                    hands: {
                        [position]: { id: updatedGame.bet.handId }
                    }
                },
                isLoading: false
            }));

            // Track bet placement in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackBet(
                    gameState.currentGame.id,
                    amount,
                    position,
                    updatedGame.bet.handId
                );
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: updatedGame };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to place bet',
                    'bet_placement_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService, gameState.currentGame]);

    /**
     * Deal cards
     */
    const dealCards = useCallback(async () => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        if (!gameState.currentGame) {
            throw new Error('No active game');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Use performAction to simulate dealCards since it's not directly available
            const updatedGame = await gameService.performAction(
                gameState.currentGame.id,
                'player1', // This should be replaced with the actual player ID
                'hand1',   // This should be replaced with the actual hand ID
                'deal' as HandAction // Cast as HandAction since 'deal' might not be in the type
            );

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: gameState.currentGame!.id,
                    hands: prev.currentGame?.hands || {}
                },
                isLoading: false
            }));

            // Track deal in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'deal',
                    gameState.currentGame.id
                );
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: updatedGame };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to deal cards',
                    'deal_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService, gameState.currentGame]);

    /**
     * Take action on a hand (hit, stand, double, split, surrender)
     */
    const takeAction = useCallback(async (
        action: 'hit' | 'stand' | 'double' | 'split' | 'surrender',
        handId: string
    ) => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        if (!gameState.currentGame) {
            throw new Error('No active game');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const updatedGame = await gameService.performAction(
                gameState.currentGame.id,
                'player1', // This should be replaced with the actual player ID
                handId,
                action as HandAction
            );

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: gameState.currentGame!.id,
                    hands: prev.currentGame?.hands || {}
                },
                isLoading: false
            }));

            // Track action in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    action,
                    gameState.currentGame.id,
                    handId
                );
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: updatedGame };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    `Failed to ${action}`,
                    'action_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService, gameState.currentGame]);

    /**
     * Complete the dealer's turn
     */
    const completeDealerTurn = useCallback(async () => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        if (!gameState.currentGame) {
            throw new Error('No active game');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Use performAction to simulate completeDealerTurn
            const updatedGame = await gameService.performAction(
                gameState.currentGame.id,
                'dealer', // Use 'dealer' as the player ID for dealer actions
                'dealer-hand', // Use a consistent ID for dealer hand
                'stand' as HandAction // Dealer completes turn by standing
            );

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: gameState.currentGame!.id,
                    hands: prev.currentGame?.hands || {}
                },
                isLoading: false
            }));

            // Track dealer turn in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'dealer_turn',
                    gameState.currentGame.id
                );
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: updatedGame };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to complete dealer turn',
                    'dealer_turn_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService, gameState.currentGame]);

    /**
     * Complete the round and get results
     */
    const completeRound = useCallback(async () => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        if (!gameState.currentGame) {
            throw new Error('No active game');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Use performAction as a proxy for completeRound since it doesn't exist
            const updatedGame = await gameService.performAction(
                gameState.currentGame.id,
                'system', // Use 'system' as the player ID for system actions
                'system-hand', // Use a consistent ID for system hand
                'settle' as HandAction // Use a custom action to represent settlement
            );

            setGameState(prev => ({
                ...prev,
                currentGame: {
                    id: gameState.currentGame!.id,
                    hands: prev.currentGame?.hands || {}
                },
                isLoading: false
            }));

            // Track round completion in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'round_complete',
                    gameState.currentGame.id
                );
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game: updatedGame };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to complete round',
                    'round_completion_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService, gameState.currentGame]);

    /**
     * End the current game (cleanup and finalize)
     */
    const endGame = useCallback(async () => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        if (!gameState.currentGame) {
            throw new Error('No active game');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            await gameService.endGame(gameState.currentGame.id);

            // Track game end in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'game_end',
                    gameState.currentGame.id
                );
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            setGameState(prev => ({
                ...prev,
                currentGame: null,
                isLoading: false
            }));

            return { success: true };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to end game',
                    'game_end_failed',
                    err as Record<string, unknown>
                );
            }

            setGameState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [gameService, gameState.currentGame]);

    return {
        ...gameState,
        service: getTypedService<GameService>(gameService),
        createGame,
        loadGame,
        loadGameHistory,
        placeBet,
        dealCards,
        takeAction,
        completeDealerTurn,
        completeRound,
        endGame,

        // Shorthand actions
        hit: (handId: string) => takeAction('hit', handId),
        stand: (handId: string) => takeAction('stand', handId),
        double: (handId: string) => takeAction('double', handId),
        split: (handId: string) => takeAction('split', handId),
        surrender: (handId: string) => takeAction('surrender', handId)
    };
}