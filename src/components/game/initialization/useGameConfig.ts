'use client';

/**
 * useGameConfig.ts
 *
 * Hook for handling game configuration, initialization,
 * and providing available game options.
 */
import { useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/store/game/gameStore';
import { toast } from 'sonner';
import { DEFAULT_STARTING_CHIPS } from '@/lib/constants/gameConstants';

// Available game variants
export const GAME_VARIANTS = [
    { id: 'CLASSIC', name: 'Classic Blackjack', description: 'Traditional blackjack rules' },
    { id: 'EUROPEAN', name: 'European Blackjack', description: 'European style with no hole card' },
    { id: 'VEGAS', name: 'Vegas Strip', description: 'Las Vegas standard rules' }
];

/**
 * Hook for managing game configuration
 */
export function useGameConfig(analytics?: {
    startSession?: (initialBalance: number) => void;
    endSession?: (finalBalance: number) => void;
}) {
    const [isLoading, setIsLoading] = useState(true);

    // Get state and actions from the store
    const {
        // Game state
        isInitialized,
        gameRules,
        players,

        // Actions
        initializeGame,
        addPlayer,
        resetGame
    } = useGameStore();

    /**
     * Initialize the game with configuration
     */
    const initializeWithConfig = useCallback((options = {}) => {
        setIsLoading(true);

        try {
            // Initialize the game with provided options
            initializeGame(options);

            // Make sure we have a player
            if (players.length === 0) {
                addPlayer('Player', DEFAULT_STARTING_CHIPS);
            }

            // Track analytics if provided
            if (analytics?.startSession) {
                const initialBalance = players[0]?.balance ?? DEFAULT_STARTING_CHIPS;
                analytics.startSession(initialBalance);
            }

            // Show welcome toast
            toast.success('Welcome to Royal Edge Casino', {
                description: 'Place your bets to begin playing!',
                duration: 5000,
            });

            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Error initializing game:', error);
            toast.error('Failed to initialize game', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });

            setIsLoading(false);
            return false;
        }
    }, [initializeGame, addPlayer, players, analytics]);

    /**
     * Initialize the game on mount if not already initialized
     */
    useEffect(() => {
        if (!isInitialized) {
            initializeWithConfig();
        } else {
            setIsLoading(false);
        }

        // Cleanup on unmount
        return () => {
            if (analytics?.endSession) {
                const finalBalance = players[0]?.balance ?? 0;
                analytics.endSession(finalBalance);
            }
        };
    }, [isInitialized, initializeWithConfig, players, analytics]);

    /**
     * Change the game variant
     */
    const changeGameVariant = useCallback((variantId: string) => {
        // Find the variant
        const variant = GAME_VARIANTS.find(v => v.id === variantId);
        if (!variant) {
            console.error(`Invalid game variant: ${variantId}`);
            return false;
        }

        try {
            // Reset the game with the new variant
            resetGame();

            // Initialize with the new variant
            initializeWithConfig({ variant: variantId });

            toast.success(`Switched to ${variant.name}`, {
                description: variant.description,
            });

            return true;
        } catch (error) {
            console.error(`Error changing game variant to ${variantId}:`, error);
            return false;
        }
    }, [resetGame, initializeWithConfig]);

    /**
     * Update table limits
     */
    const updateTableLimits = useCallback((minimumBet: number, maximumBet: number) => {
        try {
            // Reset and initialize with new limits
            initializeWithConfig({
                ...gameRules,
                tableLimits: {
                    ...gameRules.tableLimits,
                    minimumBet,
                    maximumBet
                }
            });

            toast.success('Table limits updated', {
                description: `Min: $${minimumBet} - Max: $${maximumBet}`,
            });

            return true;
        } catch (error) {
            console.error('Error updating table limits:', error);
            return false;
        }
    }, [gameRules, initializeWithConfig]);

    /**
     * Update number of decks
     */
    const updateNumberOfDecks = useCallback((decks: number) => {
        try {
            // Reset and initialize with new deck count
            initializeWithConfig({
                ...gameRules,
                numberOfDecks: decks
            });

            toast.success(`Using ${decks} deck${decks !== 1 ? 's' : ''}`, {
                description: 'Shoe has been reshuffled',
            });

            return true;
        } catch (error) {
            console.error('Error updating number of decks:', error);
            return false;
        }
    }, [gameRules, initializeWithConfig]);

    return {
        // State
        isLoading,
        gameRules,

        // Game configuration
        gameVariants: GAME_VARIANTS,

        // Actions
        initializeWithConfig,
        changeGameVariant,
        updateTableLimits,
        updateNumberOfDecks,

        // Utilities
        resetGame
    };
}