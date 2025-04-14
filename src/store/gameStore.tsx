'use client';

/**
 * gameStore.tsx
 * Core state management for the Blackjack game application
 *
 * This file integrates all domain-specific slices into a unified store
 * and provides hooks and utilities for accessing game state.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import createBetSlice from './slices/betSlice';
import createDeckSlice from './slices/deckSlice';
import createPlayerSlice from './slices/playerSlice';
import createHandSlice from './slices/handSlice';
import { createGamePhaseSlice } from './slices/gamePhaseSlice';
import { createStatisticsSlice } from './slices/statisticsSlice';
import { createAudioSlice } from './slices/audioSlice';
import { createSettingsSlice } from './slices/settingsSlice';

import type { StateCreator } from 'zustand';
import type { GameStore } from '../types/storeTypes';
import type { GameRules } from '../types/gameTypes';

import {
    VEGAS_RULES,
    DEFAULT_STARTING_CHIPS
} from '../lib/constants/gameConstants';

// Define a comprehensive GameState interface to fix TypeScript errors
interface GameState {
    // Core game state
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    lastAction: string | null;
    message?: string;
    gameRules: GameRules & {
        decksCount: number;
        dealerHitsSoft17: boolean;
    };
    gamePhase: string;

    // Player related
    players: Array<{ id: string; name: string; balance: number; }>;
    activePlayerIndex: number;

    // Hands related
    playerHands: Array<{
        id: string;
        cards: string[];
        bet: number;
        result?: string;
        isBlackjack?: boolean;
        isBusted?: boolean;
        canSplit?: boolean;
        bestValue: number;
    }>;
    dealerHand: {
        cards: string[];
        isBlackjack?: boolean;
        isBusted?: boolean;
        isSoft?: boolean;
        bestValue: number;
        hasHiddenCard?: boolean;
    };
    activeHandIndex: number;

    // Bet related
    bets: Array<{ status: string; handId: string; amount: number; }>;
    currentBet: number;
    minBet: number;
    maxBet: number;
    insuranceBet?: number;
    insuranceTaken?: boolean;

    // Statistics
    statistics: Record<string, number | string | boolean>;
    settings: Record<string, number | string | boolean>;

    // Entities
    entities: {
        cards: Record<string, { rank: string; suit: string; value: number; }>;
    };

    // Methods
    createShoe: (decksCount: number) => void;
    addPlayer: (name: string, chips: number) => void;
    clearHands: () => void;
    clearBets: () => void;
    resetStatistics: () => void;
    setGamePhase: (phase: string) => void;
    playSound: (sound: string) => void;
    createHand: (playerId: string, betAmount: number) => { id: string; cards: string[]; bet: number; bestValue: number; };
    addCardToHand: (handId: string, cardId: string) => void;
    addCardToDealerHand: (cardId: string) => void;
    drawCard: (faceUp: boolean) => string;
    checkForBlackjacks: () => void;
    revealDealerHoleCard: () => void;
    hasReachedCutCard: () => boolean;
    getEntities: () => { cards: Record<string, { rank: string; suit: string; value: number; }>; };
    settleBet: (handId: string, result: string) => number;
    updateBet: (handId: string, amount: number) => void;
    updatePlayerBalance: (playerId: string, amount: number) => void;
    recordStatistic: (key: string, value: number) => void;
    updateHand: (handId: string, updates: Partial<{ hasHiddenCard: boolean; }>) => void;
    splitHand: (handId: string) => Array<{ id: string; cards: string[]; bet: number; bestValue: number; }>;
    canDoubleDown: () => boolean;
    canSplit: () => boolean;
    canSurrender: () => boolean;
    startNewRound: () => boolean;
    resetGame: () => boolean;
    clearError: () => void;
    calculateNextBet: () => number;

    // User authentication state
    userId: string | null;
    setUserId: (userId: string | null) => void;
}

// Define a comprehensive game store type
type ExtendedGameStore = GameStore & GameState;

// Define our middleware type for proper typing of the store creators
type _GameStoreMiddleware = <T>(
    f: StateCreator<ExtendedGameStore, [], [], T>
) => StateCreator<ExtendedGameStore, [], [], T>;

/**
 * Combine all slices to create the main game store
 * Each slice is responsible for a specific domain of functionality
 */
export const useGameStore = create<ExtendedGameStore>()(
    devtools(
        persist(
            ((...args) => {
                // Extract set and get from args for type safety
                const [set, get, store] = args;

                // Create each slice with properly typed arguments
                return {
                    // Core game state
                    isInitialized: false,
                    isLoading: false,
                    error: null,
                    lastAction: null,
                    gameRules: VEGAS_RULES,
                    gamePhase: 'betting',

                    // Type assertion with a simpler approach
                    // This suppresses TypeScript errors while maintaining functionality
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    ...createPlayerSlice(set as any, get as any, store as any),
                    ...createHandSlice(set as any, get as any, store as any),
                    ...createDeckSlice(set as any, get as any, store as any),
                    ...createBetSlice(set as any, get as any, store as any),
                    ...createGamePhaseSlice(set, get),
                    ...createStatisticsSlice(set, get),
                    ...createAudioSlice(set, get),
                    ...createSettingsSlice(set, get),
                    /* eslint-enable @typescript-eslint/no-explicit-any */

                    // User authentication state
                    userId: null,
                    setUserId: (userId: string | null) => {
                        set({ userId });
                        console.log('User ID set:', userId);
                    },

                    /**
                     * Initialize the game with default settings or custom rules
                     */
                    initializeGame: (options?: Partial<GameRules>) => {
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
                            createShoe(gameRules.decksCount);

                            // Add the player if none exists
                            if (get().players.length === 0) {
                                addPlayer('Player', DEFAULT_STARTING_CHIPS);
                            }

                            // Reset game state
                            clearHands();
                            clearBets();
                            resetStatistics();
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
                                isLoading: false,
                                error: error instanceof Error ? error.message : 'Failed to initialize game',
                                isInitialized: false
                            });
                            return false;
                        }
                    },

                    /**
                     * Deal cards to start a new round
                     */
                    dealCards: () => {
                        const {
                            gamePhase,
                            players,
                            activePlayerIndex,
                            bets,
                            drawCard,
                            createHand,
                            addCardToHand,
                            addCardToDealerHand,
                            setGamePhase,
                            playSound
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'betting') {
                                throw new Error('Cannot deal cards outside betting phase');
                            }

                            const currentPlayer = players[activePlayerIndex];
                            if (!currentPlayer) {
                                throw new Error('No active player');
                            }

                            const currentBet = bets.find((b: { status: string, handId: string }) =>
                                b.status === 'pending' &&
                                b.handId.startsWith(currentPlayer.id)
                            );

                            if (!currentBet) {
                                throw new Error('Please place a bet before dealing');
                            }

                            // Play shuffle sound
                            playSound('shuffle');

                            set({ isLoading: true });

                            // Create player hand
                            const playerHand = createHand(currentPlayer.id, currentBet.amount);

                            // Deal cards in proper sequence: player, dealer, player, dealer
                            addCardToHand(playerHand.id, drawCard(true));
                            addCardToDealerHand(drawCard(true));
                            addCardToHand(playerHand.id, drawCard(true));
                            addCardToDealerHand(drawCard(false)); // Face-down card

                            // Play deal sound
                            playSound('deal');

                            // Move to player turn phase
                            setGamePhase('playerTurn');

                            set({
                                isLoading: false,
                                message: 'Your turn. Choose an action.'
                            });

                            // Check for blackjacks immediately
                            get().checkForBlackjacks();

                            return true;
                        } catch (error) {
                            set({
                                isLoading: false,
                                error: error instanceof Error ? error.message : 'Failed to deal cards'
                            });
                            return false;
                        }
                    },

                    /**
                     * Check for blackjacks after initial deal
                     */
                    checkForBlackjacks: () => {
                        const {
                            playerHands,
                            dealerHand,
                            setGamePhase,
                            settleBet,
                            playSound,
                            updatePlayerBalance,
                            players,
                            activePlayerIndex,
                            recordStatistic,
                            getEntities
                        } = get();

                        // Skip if no hands
                        if (!dealerHand || playerHands.length === 0) {
                            return;
                        }

                        const playerHand = playerHands[0];
                        if (!playerHand) return;

                        const currentPlayer = players[activePlayerIndex];

                        // Check for player blackjack
                        if (playerHand.isBlackjack) {
                            // Play blackjack sound
                            playSound('blackjack');

                            // Check if dealer's up card is an Ace or 10-value card
                            const dealerUpCardId = dealerHand.cards[0];
                            const entities = getEntities();
                            const dealerUpCard = dealerUpCardId ? entities.cards[dealerUpCardId] : null;

                            // Check if dealer's up card indicates possible blackjack
                            const isPossibleDealerBlackjack = dealerUpCard &&
                                (dealerUpCard.rank === 'A' ||
                                    dealerUpCard.rank === '10' ||
                                    dealerUpCard.rank === 'J' ||
                                    dealerUpCard.rank === 'Q' ||
                                    dealerUpCard.rank === 'K');

                            // Find if dealer has blackjack
                            const dealerHasBlackjack = dealerHand.isBlackjack;

                            // Reveal dealer's hole card
                            get().revealDealerHoleCard();

                            if (dealerHasBlackjack) {
                                // Both have blackjack - it's a push
                                set({ message: 'Both have Blackjack! Push.' });

                                // Settle the bet as a push
                                settleBet(playerHand.id, 'push');
                                recordStatistic('pushes', 1);
                            } else {
                                // Player has blackjack, dealer doesn't
                                set({ message: `Blackjack! You win 3:2. ${isPossibleDealerBlackjack ? 'Dealer checked for blackjack.' : ''}` });

                                // Settle the bet as a blackjack win
                                const winnings = settleBet(playerHand.id, 'blackjack');

                                // Update player balance
                                if (currentPlayer) {
                                    updatePlayerBalance(currentPlayer.id, winnings);
                                }

                                recordStatistic('blackjacks', 1);
                                recordStatistic('handsWon', 1);
                            }

                            // Move to settlement phase
                            setGamePhase('settlement');
                        }
                    },

                    /**
                     * Double Down - double bet and take one more card
                     */
                    double: (playerId: string, handId: string) => {
                        const {
                            gamePhase,
                            players,
                            activePlayerIndex,
                            playerHands,
                            drawCard,
                            addCardToHand,
                            stand,
                            playSound,
                            updatePlayerBalance,
                            updateBet
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'playerTurn') {
                                throw new Error('Cannot double down outside player turn');
                            }

                            // Find the hand
                            const handIndex = playerHands.findIndex((h: { id: string }) => h.id === handId);
                            if (handIndex === -1) {
                                throw new Error('Hand not found');
                            }

                            const hand = playerHands[handIndex];
                            if (!hand) {
                                throw new Error('Hand not found');
                            }

                            // Can only double on first two cards
                            if (hand.cards.length !== 2) {
                                throw new Error('Can only double down on the first two cards');
                            }

                            // Check if player has enough chips
                            const currentPlayer = players[activePlayerIndex];
                            if (!currentPlayer) {
                                throw new Error('No active player');
                            }

                            if (currentPlayer.balance < hand.bet) {
                                throw new Error('Insufficient chips to double down');
                            }

                            // Double the bet
                            updateBet(handId, hand.bet * 2);

                            // Take money from player
                            updatePlayerBalance(currentPlayer.id, -hand.bet);

                            // Play chip sound
                            playSound('chip');

                            set({ message: 'Double down! Bet doubled.' });

                            // Deal one more card
                            const card = drawCard(true);
                            addCardToHand(handId, card);

                            // Play card sound
                            playSound('card');

                            // Get updated hand
                            const updatedHand = get().playerHands[handIndex];

                            // Check if player busted
                            if (updatedHand?.isBusted) {
                                set({ message: 'Bust! You lose.' });
                                playSound('bust');
                                get().recordStatistic('busts', 1);
                            } else {
                                set({ message: `Doubled down with ${updatedHand?.bestValue}. Dealer's turn.` });
                            }

                            // Always stand after doubling down
                            setTimeout(() => {
                                stand(playerId, handId);
                            }, 1000);

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to double down'
                            });
                            return false;
                        }
                    },

                    /**
                     * Hit - take another card for the current hand
                     */
                    hit: (playerId: string, handId: string) => {
                        const {
                            gamePhase,
                            playerHands,
                            drawCard,
                            addCardToHand,
                            stand,
                            playSound,
                            recordStatistic
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'playerTurn') {
                                throw new Error('Cannot hit outside player turn');
                            }

                            // Find the hand
                            const handIndex = playerHands.findIndex((h: { id: string }) => h.id === handId);
                            if (handIndex === -1) {
                                throw new Error('Hand not found');
                            }

                            // Play card sound
                            playSound('card');

                            // Deal a card to the hand
                            const card = drawCard(true);
                            addCardToHand(handId, card);

                            // Get updated hand
                            const updatedHand = get().playerHands[handIndex];

                            // Check if player busted
                            if (updatedHand?.isBusted) {
                                set({ message: 'Bust! You lose.' });
                                playSound('bust');
                                recordStatistic('busts', 1);

                                // Move to next hand or dealer's turn
                                stand(playerId, handId);
                            } else if (updatedHand && updatedHand.bestValue === 21) {
                                // Player reached 21, automatically stand
                                set({ message: 'Twenty-one! Standing.' });
                                playSound('win');

                                setTimeout(() => {
                                    stand(playerId, handId);
                                }, 1000);
                            } else {
                                set({ message: `You drew a card. Hand value: ${updatedHand?.bestValue}` });
                            }

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to hit'
                            });
                            return false;
                        }
                    },

                    /**
                     * Stand - end player's turn with current hand
                     */
                    stand: (_playerId: string, _handId: string) => {
                        const {
                            gamePhase,
                            playerHands,
                            activeHandIndex,
                            playSound,
                            setGamePhase
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'playerTurn') {
                                throw new Error('Cannot stand outside player turn');
                            }

                            playSound('chip');

                            // If this is the last hand, move to dealer's turn
                            if (activeHandIndex >= playerHands.length - 1) {
                                set({ message: "Player stands. Dealer's turn." });
                                setGamePhase('dealerTurn');

                                // Start dealer's turn
                                setTimeout(() => {
                                    get().dealerPlay();
                                }, 1000);
                            } else {
                                // Move to next hand
                                set({
                                    activeHandIndex: activeHandIndex + 1,
                                    message: 'Playing next hand.'
                                });
                            }

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to stand'
                            });
                            return false;
                        }
                    },

                    /**
                     * Split a pair into two hands
                     */
                    split: (playerId: string, handId: string) => {
                        const {
                            gamePhase,
                            players,
                            activePlayerIndex,
                            playerHands,
                            drawCard,
                            addCardToHand,
                            updatePlayerBalance,
                            playSound,
                            splitHand
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'playerTurn') {
                                throw new Error('Cannot split outside player turn');
                            }

                            // Find the hand
                            const handIndex = playerHands.findIndex((h: { id: string }) => h.id === handId);
                            if (handIndex === -1) {
                                throw new Error('Hand not found');
                            }

                            const hand = playerHands[handIndex];
                            if (!hand) {
                                throw new Error('Hand not found');
                            }

                            // Check if hand can be split
                            if (!hand.canSplit) {
                                throw new Error('This hand cannot be split');
                            }

                            // Check if player has enough chips
                            const currentPlayer = players[activePlayerIndex];
                            if (!currentPlayer) {
                                throw new Error('No active player');
                            }

                            if (currentPlayer.balance < hand.bet) {
                                throw new Error('Insufficient chips to split');
                            }

                            // Take money from player for the second bet
                            updatePlayerBalance(currentPlayer.id, -hand.bet);

                            // Play chip sound
                            playSound('chip');

                            // Split the hand
                            const [hand1, hand2] = splitHand(handId);

                            // Deal a card to each hand
                            setTimeout(() => {
                                const card1 = drawCard(true);
                                addCardToHand(hand1?.id || '', card1);

                                const card2 = drawCard(true);
                                addCardToHand(hand2?.id || '', card2);

                                // Play card sound
                                playSound('card');

                                set({ message: 'Hand split into two hands.' });
                            }, 500);

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to split'
                            });
                            return false;
                        }
                    },

                    /**
                     * Surrender - give up half the bet
                     */
                    surrender: (playerId: string, handId: string) => {
                        const {
                            gamePhase,
                            players,
                            activePlayerIndex,
                            playerHands,
                            updatePlayerBalance,
                            settleBet,
                            stand,
                            playSound,
                            recordStatistic
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'playerTurn') {
                                throw new Error('Cannot surrender outside player turn');
                            }

                            // Find the hand
                            const handIndex = playerHands.findIndex((h: { id: string }) => h.id === handId);
                            if (handIndex === -1) {
                                throw new Error('Hand not found');
                            }

                            const hand = playerHands[handIndex];
                            if (!hand) {
                                throw new Error('Hand not found');
                            }

                            // Can only surrender on first two cards
                            if (hand.cards.length !== 2) {
                                throw new Error('Can only surrender on the first two cards');
                            }

                            // Get active player
                            const currentPlayer = players[activePlayerIndex];
                            if (!currentPlayer) {
                                throw new Error('No active player');
                            }

                            // Return half the bet
                            const returnAmount = hand.bet / 2;
                            updatePlayerBalance(currentPlayer.id, returnAmount);

                            // Play surrender sound
                            playSound('surrender');

                            // Settle the bet as surrendered
                            settleBet(handId, 'surrender');

                            set({ message: 'You surrendered. Half your bet is returned.' });

                            // Record surrender
                            recordStatistic('surrenders', 1);

                            // Move to next hand or dealer's turn
                            stand(playerId, handId);

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to surrender'
                            });
                            return false;
                        }
                    },

                    /**
                     * Place insurance bet
                     */
                    insurance: (playerId: string, handId: string, amount: number) => {
                        const {
                            gamePhase,
                            players,
                            activePlayerIndex,
                            dealerHand,
                            updatePlayerBalance,
                            playSound,
                            getEntities
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'playerTurn') {
                                throw new Error('Cannot take insurance outside player turn');
                            }

                            // Check if dealer's up card is an Ace
                            const entities = getEntities();
                            const dealerUpCardId = dealerHand?.cards[0];
                            const dealerUpCard = dealerUpCardId ? entities.cards[dealerUpCardId] : null;

                            if (!dealerUpCard || dealerUpCard.rank !== 'A') {
                                throw new Error('Insurance only available when dealer shows an Ace');
                            }

                            // Get active player
                            const currentPlayer = players[activePlayerIndex];
                            if (!currentPlayer) {
                                throw new Error('No active player');
                            }

                            // Insurance costs half the original bet
                            const firstPlayerHand = get().playerHands && get().playerHands.length > 0 ? get().playerHands[0] : null;
                            const baseBet = firstPlayerHand?.bet ?? 0;
                            const insuranceBet = amount || baseBet / 2 || 0;

                            if (insuranceBet <= 0) {
                                throw new Error('Invalid insurance amount');
                            }

                            // Check if player has enough chips
                            if (currentPlayer.balance < insuranceBet) {
                                throw new Error('Insufficient chips for insurance');
                            }

                            // Take insurance amount from player
                            updatePlayerBalance(currentPlayer.id, -insuranceBet);

                            // Play chip sound
                            playSound('chip');

                            set({
                                insuranceBet: insuranceBet,
                                insuranceTaken: true,
                                message: 'Insurance taken.'
                            });

                            // Reveal dealer's hole card
                            get().revealDealerHoleCard();

                            // Check if dealer has blackjack
                            const dealerHasBlackjack = dealerHand?.isBlackjack;

                            if (dealerHasBlackjack) {
                                // Insurance pays 2:1
                                const insurancePayment = insuranceBet * 2;
                                updatePlayerBalance(currentPlayer.id, insurancePayment);

                                // Play win sound
                                playSound('win');

                                set({ message: 'Dealer has Blackjack. Insurance pays 2:1.' });

                                // Move to settlement
                                get().setGamePhase('settlement');
                                setTimeout(() => {
                                    get().settleRound();
                                }, 1500);
                            } else {
                                set({ message: 'Dealer does not have Blackjack. Insurance lost.' });

                                // Continue with player's turn
                            }

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to take insurance'
                            });
                            return false;
                        }
                    },

                    /**
                     * Handle dealer's turn
                     */
                    dealerPlay: () => {
                        const {
                            gamePhase,
                            dealerHand,
                            gameRules,
                            revealDealerHoleCard,
                            drawCard,
                            addCardToDealerHand,
                            setGamePhase,
                            playSound
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'dealerTurn') {
                                throw new Error('Cannot play dealer outside dealer turn');
                            }

                            if (!dealerHand) {
                                throw new Error('No dealer hand');
                            }

                            // First reveal the hole card
                            revealDealerHoleCard();
                            playSound('card');

                            // Process the next dealer action based on current hand
                            const processNextDealerAction = () => {
                                const currentHand = get().dealerHand;
                                if (!currentHand) return false;

                                const hitSoft17 = gameRules.dealerHitsSoft17;

                                // Dealer's rules: hit on 16 or less, stand on 17+
                                // (or hit on soft 17 if that rule is enabled)
                                const shouldHit = (
                                    currentHand.bestValue < 17 ||
                                    (hitSoft17 && currentHand.isSoft && currentHand.bestValue === 17)
                                );

                                if (shouldHit) {
                                    set({ message: `Dealer hits with ${currentHand.bestValue}.` });

                                    // Deal a card to the dealer
                                    const card = drawCard(true);
                                    addCardToDealerHand(card);
                                    playSound('card');

                                    // Check if dealer busted
                                    const updatedHand = get().dealerHand;
                                    if (updatedHand?.isBusted) {
                                        set({ message: `Dealer busts with ${updatedHand.bestValue}!` });
                                        playSound('bust');

                                        // Move to settlement
                                        setGamePhase('settlement');

                                        // Schedule settlement
                                        setTimeout(() => get().settleRound(), 1500);
                                        return false;
                                    }

                                    // Continue dealer's turn after delay
                                    setTimeout(processNextDealerAction, 1000);
                                    return true;
                                } else {
                                    // Dealer stands
                                    set({ message: `Dealer stands with ${currentHand.bestValue}.` });

                                    // Move to settlement
                                    setGamePhase('settlement');

                                    // Schedule settlement
                                    setTimeout(() => get().settleRound(), 1500);
                                    return false;
                                }
                            };

                            // Delay for animation
                            setTimeout(() => {
                                set({ message: 'Dealer reveals hole card.' });
                                processNextDealerAction();
                            }, 1000);

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to play dealer'
                            });
                            return false;
                        }
                    },

                    /**
                     * Reveal dealer's hole card
                     */
                    revealDealerHoleCard: () => {
                        const { dealerHand, updateHand } = get();

                        if (!dealerHand) return;

                        // Update hole card to face up
                        updateHand('dealer', {
                            hasHiddenCard: false
                        });
                    },

                    /**
                     * Settle the round and determine winners
                     */
                    settleRound: () => {
                        const {
                            gamePhase,
                            playerHands,
                            dealerHand,
                            players,
                            activePlayerIndex,
                            setGamePhase,
                            recordStatistic,
                            settleBet,
                            updatePlayerBalance,
                            playSound
                        } = get();

                        // Define type alias for hand result
                        type HandResult = 'win' | 'loss' | 'blackjack' | 'bust' | 'push';

                        // Helper function to settle an individual player hand
                        const settlePlayerHand = (
                            hand: {
                                id: string;
                                isBusted?: boolean;
                                isBlackjack?: boolean;
                                bestValue: number;
                                bet: number;
                                result?: string;
                            },
                            dealerHand: {
                                isBlackjack?: boolean;
                                isBusted?: boolean;
                                bestValue: number;
                            },
                            currentPlayer: {
                                id: string;
                            }
                        ) => {
                            // Handle busted hand
                            if (hand.isBusted) {
                                settleBet(hand.id, 'bust' as HandResult);
                                recordStatistic('handsLost', 1);
                                return;
                            }

                            // Handle blackjack
                            if (hand.isBlackjack) {
                                // Handle blackjack settlement
                                if (dealerHand.isBlackjack) {
                                    // Push
                                    settleBet(hand.id, 'push' as HandResult);
                                    updatePlayerBalance(currentPlayer.id, hand.bet);
                                    recordStatistic('pushes', 1);
                                } else {
                                    // Win with blackjack
                                    const winnings = settleBet(hand.id, 'blackjack' as HandResult);
                                    updatePlayerBalance(currentPlayer.id, winnings);
                                    recordStatistic('blackjacks', 1);
                                    recordStatistic('handsWon', 1);
                                }
                                return;
                            }

                            // Handle dealer bust
                            if (dealerHand.isBusted) {
                                const winnings = settleBet(hand.id, 'win' as HandResult);
                                updatePlayerBalance(currentPlayer.id, winnings);
                                playSound('win');
                                recordStatistic('handsWon', 1);
                                return;
                            }

                            // Compare hand values
                            if (hand.bestValue > dealerHand.bestValue) {
                                // Player wins
                                const winnings = settleBet(hand.id, 'win' as HandResult);
                                updatePlayerBalance(currentPlayer.id, winnings);
                                playSound('win');
                                recordStatistic('handsWon', 1);
                            } else if (hand.bestValue < dealerHand.bestValue) {
                                // Dealer wins
                                settleBet(hand.id, 'loss' as HandResult);
                                playSound('lose');
                                recordStatistic('handsLost', 1);
                            } else {
                                // Push - tie
                                settleBet(hand.id, 'push' as HandResult);
                                updatePlayerBalance(currentPlayer.id, hand.bet);
                                playSound('push');
                                recordStatistic('pushes', 1);
                            }
                        };

                        // Generate appropriate message based on settlement results
                        const generateSettlementMessage = (hands: Array<{ result?: string }>) => {
                            const isWinningHand = (h: { result?: string }) =>
                                h.result === 'win' || h.result === 'blackjack';
                            const isLosingHand = (h: { result?: string }) =>
                                h.result === 'loss' || h.result === 'bust';
                            const isPushHand = (h: { result?: string }) =>
                                h.result === 'push';

                            const winningHands = hands.filter(isWinningHand);
                            const losingHands = hands.filter(isLosingHand);
                            const pushHands = hands.filter(isPushHand);

                            if (winningHands.length > 0 && losingHands.length === 0) {
                                return 'Congratulations! All hands won.';
                            }
                            if (losingHands.length > 0 && winningHands.length === 0) {
                                return 'Dealer wins this round.';
                            }
                            if (pushHands.length === hands.length) {
                                return 'Push. Bets returned.';
                            }
                            return 'Round complete.';
                        };

                        try {
                            // Validate game state
                            if (gamePhase !== 'settlement') {
                                throw new Error('Cannot settle round outside settlement phase');
                            }

                            if (!dealerHand) {
                                throw new Error('No dealer hand');
                            }

                            const currentPlayer = players[activePlayerIndex];
                            if (!currentPlayer) {
                                throw new Error('No active player');
                            }

                            // Process each hand settlement
                            playerHands.forEach(hand => {
                                if (!hand.result) {
                                    settlePlayerHand(hand, dealerHand, currentPlayer);
                                }
                            });

                            // Generate appropriate message
                            set({ message: generateSettlementMessage(playerHands) });

                            // Move to completed phase
                            setGamePhase('completed');

                            // Update statistics
                            recordStatistic('handsPlayed', playerHands.length);

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to settle round'
                            });
                            return false;
                        }
                    },

                    /**
                     * Start a new round
                     */
                    startNewRound: () => {
                        const {
                            gamePhase,
                            hasReachedCutCard,
                            createShoe,
                            gameRules,
                            clearHands,
                            clearBets,
                            setGamePhase
                        } = get();

                        try {
                            // Validate game state
                            if (gamePhase !== 'completed') {
                                throw new Error('Cannot start new round outside completed phase');
                            }

                            // Check if we need to reshuffle
                            if (hasReachedCutCard()) {
                                set({ message: 'Reshuffling the cards...' });
                                createShoe(gameRules.decksCount);
                            }

                            // Reset for new round
                            clearHands();
                            clearBets();
                            setGamePhase('betting');

                            set({ message: 'Place your bet to begin.' });

                            return true;
                        } catch (error) {
                            set({
                                error: error instanceof Error ? error.message : 'Failed to start new round'
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
                        return get().entities;
                    },

                    // Add setGamePhase compatibility function that calls transitionTo
                    setGamePhase: (phase: string) => {
                        const { transitionTo } = get();
                        const currentPhase = get().gamePhase;

                        // Skip transition if already in the target phase to avoid validation errors
                        if (phase === currentPhase) {
                            console.log(`Already in ${phase} phase, skipping transition`);
                            return;
                        }

                        if (transitionTo) {
                            transitionTo(phase as GamePhase, 'manual_transition');
                        } else {
                            console.error('transitionTo function is not available');
                            // Fallback: Directly set the phase if transitionTo isn't available
                            set({ gamePhase: phase });
                        }
                    }
                } as unknown as ExtendedGameStore;
            }),
            {
                name: 'blackjack-game-state',
                partialize: (state) => ({
                    // Only persist essential game state
                    isInitialized: state.isInitialized,
                    gameRules: state.gameRules,
                    players: state.players,
                    activePlayerIndex: state.activePlayerIndex,
                })
            }
        )
    )
);

/**
 * Helper hook for accessing game status and control actions
 * Provides a simplified interface for components
 */
export const useGameControl = () => {
    const {
        isInitialized,
        isLoading,
        error,
        gamePhase,
        message,
        initializeGame,
        dealCards,
        startNewRound,
        resetGame,
        clearError
    } = useGameStore(state => ({
        isInitialized: state.isInitialized,
        isLoading: state.isLoading,
        error: state.error,
        gamePhase: state.gamePhase,
        message: state.message,
        initializeGame: state.initializeGame,
        dealCards: state.dealCards,
        startNewRound: state.startNewRound,
        resetGame: state.resetGame,
        clearError: state.clearError
    }));

    return {
        isInitialized,
        isLoading,
        error,
        gamePhase,
        message,
        initializeGame,
        dealCards,
        startNewRound,
        resetGame,
        clearError
    };
};

/**
 * Helper hook for accessing player-related state and actions
 */
export const usePlayerActions = () => {
    const {
        players,
        activePlayerIndex,
        hit,
        stand,
        double,
        split,
        surrender,
        insurance
    } = useGameStore(state => ({
        players: state.players,
        activePlayerIndex: state.activePlayerIndex,
        hit: state.hit,
        stand: state.stand,
        double: state.double,
        split: state.split,
        surrender: state.surrender,
        insurance: state.insurance
    }));

    const currentPlayer = players[activePlayerIndex];

    return {
        players,
        currentPlayer,
        activePlayerIndex,
        hit,
        stand,
        double,
        split,
        surrender,
        insurance
    };
};

/**
 * Helper hook for accessing betting-related state and actions
 */
export const useBetting = () => {
    return useGameStore(state => ({
        bets: state.bets,
        currentBet: state.currentBet,
        minBet: state.minBet,
        maxBet: state.maxBet,
        placeBet: state.placeBet,
        clearBets: state.clearBets,
        calculateNextBet: state.calculateNextBet
    }));
};

/**
 * Helper hook for accessing hands state
 */
export const useHands = () => {
    return useGameStore(state => ({
        playerHands: state.playerHands,
        dealerHand: state.dealerHand,
        activeHandIndex: state.activeHandIndex
    }));
};

/**
 * Helper hook for accessing available actions for the current hand
 */
export const useAvailableActions = () => {
    const {
        gamePhase,
        playerHands,
        dealerHand,
        activeHandIndex,
        players,
        activePlayerIndex,
        canDoubleDown,
        canSplit,
        canSurrender
    } = useGameStore(state => ({
        gamePhase: state.gamePhase,
        playerHands: state.playerHands,
        dealerHand: state.dealerHand,
        activeHandIndex: state.activeHandIndex,
        players: state.players,
        activePlayerIndex: state.activePlayerIndex,
        canDoubleDown: state.canDoubleDown,
        canSplit: state.canSplit,
        canSurrender: state.canSurrender
    }));

    // Cannot perform any actions outside player turn
    if (gamePhase !== 'playerTurn') {
        return {
            canHit: false,
            canStand: false,
            canDouble: false,
            canSplit: false,
            canSurrender: false,
            canInsurance: false
        };
    }

    const currentHand = playerHands[activeHandIndex];
    const currentPlayer = players[activePlayerIndex];

    if (!currentHand || !currentPlayer) {
        return {
            canHit: false,
            canStand: false,
            canDouble: false,
            canSplit: false,
            canSurrender: false,
            canInsurance: false
        };
    }

    // Determine if insurance is available
    const dealerUpCardId = dealerHand?.cards[0];
    const dealerShowsAce = dealerUpCardId === 'A';

    return {
        canHit: !currentHand.isBusted,
        canStand: !currentHand.isBusted,
        canDouble: canDoubleDown(),
        canSplit: canSplit(),
        canSurrender: canSurrender(),
        canInsurance: dealerShowsAce && currentHand.cards.length === 2
    };
};

// Export default for easier imports
export default useGameStore;