/**
 * Hook for using the Game service with React
 */
import { useState, useEffect, useCallback } from 'react';
import { useService, getTypedService } from './useService';
import GameService from '../../services/api/gameService';
import EventTracker from '../../services/analytics/eventTracker';
import { ServiceError } from '../../services/serviceInterface';
import ServiceManager from '../../services/serviceRegistry';

// Define game-related interfaces
interface GameState {
    currentGame: any | null;
    gameHistory: any[];
    isLoading: boolean;
    error: ServiceError | null;
}

export default function useGameService() {
    const {
        service: gameService,
        isLoading: serviceLoading,
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
    const createGame = useCallback(async (options: any = {}) => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const newGame = await gameService.createGame(options);

            setGameState(prev => ({
                ...prev,
                currentGame: newGame,
                isLoading: false
            }));

            // Track game creation in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('game', 'game_created', {
                    gameId: newGame.id,
                    gameType: options.type || 'standard',
                    tableType: options.tableType || 'standard',
                    betMin: options.betMin,
                    betMax: options.betMax
                });
            } catch (e) {
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
                    err
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
            const game = await gameService.getGame(gameId);

            setGameState(prev => ({
                ...prev,
                currentGame: game,
                isLoading: false
            }));

            // Track game loading in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('game', 'game_loaded', {
                    gameId: game.id,
                    gameType: game.type
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, game };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to load game',
                    'game_load_failed',
                    err
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
    const loadGameHistory = useCallback(async (limit = 10, offset = 0) => {
        if (!gameService) {
            throw new Error('Game service not initialized');
        }

        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const history = await gameService.getGameHistory(limit, offset);

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
                    err
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
            const updatedGame = await gameService.placeBet(
                gameState.currentGame.id,
                amount,
                position
            );

            setGameState(prev => ({
                ...prev,
                currentGame: updatedGame,
                isLoading: false
            }));

            // Track bet placement in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackBet(
                    gameState.currentGame.id,
                    amount,
                    position,
                    updatedGame.hands[position]?.id
                );
            } catch (e) {
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
                    err
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
            const updatedGame = await gameService.dealCards(gameState.currentGame.id);

            setGameState(prev => ({
                ...prev,
                currentGame: updatedGame,
                isLoading: false
            }));

            // Track deal in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'deal',
                    gameState.currentGame.id
                );
            } catch (e) {
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
                    err
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
            const updatedGame = await gameService.takeAction(
                gameState.currentGame.id,
                handId,
                action
            );

            setGameState(prev => ({
                ...prev,
                currentGame: updatedGame,
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
            } catch (e) {
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
                    err
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
            const updatedGame = await gameService.completeDealerTurn(gameState.currentGame.id);

            setGameState(prev => ({
                ...prev,
                currentGame: updatedGame,
                isLoading: false
            }));

            // Track dealer turn in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'dealer_turn',
                    gameState.currentGame.id
                );
            } catch (e) {
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
                    err
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
            const updatedGame = await gameService.completeRound(gameState.currentGame.id);

            setGameState(prev => ({
                ...prev,
                currentGame: updatedGame,
                isLoading: false
            }));

            // Track round completion in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.trackGameAction(
                    'round_complete',
                    gameState.currentGame.id
                );
            } catch (e) {
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
                    err
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
            } catch (e) {
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
                    err
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