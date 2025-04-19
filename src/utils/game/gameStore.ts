'use client';

/**
 * gameStore.ts
 * Core state management for the Blackjack game
 *
 * This file defines the main Zustand store that integrates domain-specific
 * slices into a unified store for managing the blackjack game state.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Import slices
import createGameStateSlice from './slices/gameStateSlice';
import createPlayerSlice from './slices/playerSlice';
import createHandSlice from './slices/handSlice';
import createDeckSlice from './slices/deckSlice';
import createBetSlice from './slices/betSlice';
import createEffectsSlice from './slices/effectsSlice';

// Import types
import type {
    GameState,
    GameOptions,
    GamePhase,
    GameVariant,
    GameStatus
} from '@/types/gameTypes';
import type { HandAction, HandResult } from '@/types/handTypes';
import type { GameStore } from '@/types/storeTypes';

// Default game options
import { VEGAS_RULES, DEFAULT_STARTING_CHIPS } from '@/lib/constants/gameConstants';

/**
 * Main game store that combines all slices
 */
export const useGameStore = create<GameStore>()(
    devtools(
        persist(
            (set, get, api) => ({
                // Combine all slices
                ...createGameStateSlice(set, get, api),
                ...createPlayerSlice(set, get, api),
                ...createHandSlice(set, get, api),
                ...createDeckSlice(set, get, api),
                ...createBetSlice(set, get, api),
                ...createEffectsSlice(set, get, api),

                /**
                 * Initialize the game with default settings or custom rules
                 */
                initializeGame: (options?: Partial<GameOptions>) => {
                    const {
                        createShoe,
                        addPlayer,
                        clearHands,
                        clearBets,
                        resetStatistics,
                        setGamePhase
                    } = get();

                    set({ isLoading: true });

                    try {
                        // Set game rules (use defaults with optional overrides)
                        const gameRules = {
                            ...VEGAS_RULES,
                            ...options
                        };

                        // Create a new shoe with specified number of decks
                        createShoe(gameRules.numberOfDecks || 6);

                        // Add the player if none exists
                        if (get().players.length === 0) {
                            addPlayer('Player', DEFAULT_STARTING_CHIPS);
                        }

                        // Reset game state
                        clearHands();
                        clearBets();
                        if (resetStatistics) resetStatistics();
                        setGamePhase('betting');

                        // Mark game as initialized
                        set({
                            isInitialized: true,
                            isLoading: false,
                            error: null,
                            gameRules,
                            message: 'Place your bet to begin'
                        });

                        return true;
                    } catch (error) {
                        set({
                            error: error instanceof Error ? error.message : 'Failed to initialize game',
                            isLoading: false
                        });
                        return false;
                    }
                },

                /**
                 * Reset the entire game
                 */
                resetGame: () => {
                    const {
                        players,
                        updatePlayerBalance
                    } = get();

                    try {
                        // Reset player chips to starting amount
                        for (const player of players) {
                            const deficit = DEFAULT_STARTING_CHIPS - player.balance;
                            if (deficit !== 0) {
                                updatePlayerBalance(player.id, deficit);
                            }
                        }

                        // Reinitialize the game
                        get().initializeGame();

                        return true;
                    } catch (error) {
                        set({
                            error: error instanceof Error ? error.message : 'Failed to reset game'
                        });
                        return false;
                    }
                },

                /**
                 * Clear any errors
                 */
                clearError: () => {
                    set({ error: null });
                },

                /**
                 * Get normalized entities for easier access
                 */
                getEntities: () => {
                    return get().entities || {};
                }
            }),
            {
                name: 'blackjack-game-state',
                partialize: (state) => ({
                    isInitialized: state.isInitialized,
                    gameRules: state.gameRules,
                    players: state.players,
                    activePlayerIndex: state.activePlayerIndex,
                })
            }
        )
    )
);