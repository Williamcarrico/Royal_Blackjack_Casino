/**
 * Game state store for the blackjack game
 */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GameStore } from '../types/storeTypes';
import {
    GameState,
    GamePhase,
    GameStatus,
    GameOptions,
    GameVariant,
    Player
} from '../types/gameTypes';
import { Shoe, Card } from '../types/cardTypes';
import { DealerHand, Hand, HandAction, HandStatus } from '../types/handTypes';
import { SideBetType } from '../types/betTypes';

// Define standard side bets types
const SIDE_BETS_PAYOUTS: Record<SideBetType, number | Record<string, number>> = {
    perfectPairs: 25,
    "21+3": { "flush": 5, "straight": 10, "threeOfAKind": 30, "straightFlush": 40, "suitedTriples": 100 },
    luckyLadies: 25,
    royalMatch: 25,
    luckyLucky: 25,
    inBetween: 10,
    overUnder13: 1
};

// Define game phases for better type safety
const GAME_PHASES: Record<string, GamePhase> = {
    BETTING: 'betting',
    PLAYER_TURN: 'playerTurn',
    DEALER_TURN: 'dealerTurn',
    SETTLEMENT: 'settlement',
    ROUND_END: 'cleanup'
};

// Define game statuses for better type safety
const GAME_STATUSES: Record<string, GameStatus> = {
    IDLE: 'idle',
    ACTIVE: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed'
};

// Define hand statuses for better type safety
const HAND_STATUSES: Record<string, HandStatus> = {
    ACTIVE: 'active',
    STOOD: 'standing',
    BUSTED: 'busted',
    BLACKJACK: 'blackjack',
    SURRENDERED: 'surrender',
    SPLIT: 'active',
    DOUBLED: 'active',
    SETTLED: 'win'
};

const DEFAULT_GAME_OPTIONS: GameOptions = {
    variant: 'classic' satisfies GameVariant,
    numberOfDecks: 6,
    dealerHitsSoft17: true,
    blackjackPays: 1.5,
    doubleAfterSplit: true,
    resplitAces: false,
    lateSurrender: true,
    maxSplitHands: 4,
    penetration: 0.75,
    deckRotationStrategy: 'perShoe',
    tableLimits: {
        minimumBet: 5,
        maximumBet: 500
    },
    payoutRules: {
        blackjack: 1.5,
        regularWin: 1,
        insurance: 2,
        surrender: 0.5,
        sideBets: SIDE_BETS_PAYOUTS
    },
    allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
    availableSideBets: []
};

// Sample card for demonstration
const createSampleCard = (): Card => ({
    id: uuidv4(),
    suit: 'hearts',
    rank: 'A',
    value: 11,
    face: 'up',
    isFaceUp: true
});

// Helper to create a default hand (useful for type checking)
const createDefaultHand = (): Hand => ({
    id: uuidv4(),
    cards: [],
    values: [0],
    bestValue: 0,
    status: HAND_STATUSES.ACTIVE as HandStatus,
    actions: [],
    bet: 0,
    isDoubled: false,
    isSplit: false
});

const useGameStore = create<GameStore>((set, get) => ({
    gameState: null,
    isLoading: false,
    error: null,
    lastAction: null,
    userId: null,

    // User management functions
    setUserId: (userId: string | null) => {
        set({ userId });

        // Only load user chips if we have a user ID
        if (userId) {
            get().loadUserChips();
        }
    },

    loadUserChips: async () => {
        const userId = get().userId;
        if (!userId) return;

        try {
            set({ isLoading: true });

            // In a real implementation, fetch user chips from the database
            // For now, we'll just set a default balance for demonstration

            // Create or update player with this user ID
            const { gameState } = get();

            if (gameState) {
                // Check if player already exists
                const playerIndex = gameState.players.findIndex(p => p.id === userId);

                if (playerIndex === -1) {
                    // Add new player
                    const newPlayer: Player = {
                        id: userId,
                        name: `Player ${gameState.players.length + 1}`,
                        balance: 1000, // Default balance
                        currentBet: 0,
                        totalBet: 0,
                        hands: [],
                        isActive: false,
                        winnings: 0,
                        position: gameState.players.length
                    };

                    set({
                        gameState: {
                            ...gameState,
                            players: [...gameState.players, newPlayer]
                        }
                    });
                } else {
                    // Player exists, no need to update
                    // In a real app, you might refresh their balance here
                }
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load user chips'
            });
        }
    },

    initializeGame: (options = DEFAULT_GAME_OPTIONS) => {
        set({ isLoading: true });

        try {
            const gameId = uuidv4();

            // Create initial empty shoe (will be populated later)
            const shoe: Shoe = {
                id: uuidv4(),
                decks: [],
                cards: [],
                remaining: 0,
                penetration: options.penetration,
                cutCardPosition: 0,
                isShuffled: false
            };

            // Create initial dealer hand
            const dealerHand: DealerHand = {
                id: uuidv4(),
                cards: [],
                values: [0],
                bestValue: 0,
                status: HAND_STATUSES.ACTIVE as HandStatus,
                hasHiddenCard: false
            };

            // Create initial game state
            const gameState: GameState = {
                id: gameId,
                status: GAME_STATUSES.IDLE as GameStatus,
                currentPhase: GAME_PHASES.BETTING as GamePhase,
                shoe,
                dealer: {
                    hand: dealerHand,
                    isRevealed: false
                },
                players: [],
                activePlayerIndex: -1,
                activeHandIndex: -1,
                options,
                roundNumber: 0,
                timestamp: new Date(),
                history: [],
                // Add missing properties
                decks: [],
                lastShuffle: new Date(),
                deckPenetration: options.penetration
            };

            set({
                gameState,
                isLoading: false,
                error: null,
                lastAction: 'Game initialized'
            });

        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to initialize game'
            });
        }
    },

    placeBet: (playerId, amount) => {
        set({ isLoading: true });

        try {
            const { gameState } = get();

            if (!gameState) {
                throw new Error('Game not initialized');
            }

            if (gameState.currentPhase !== GAME_PHASES.BETTING) {
                throw new Error('Betting is only allowed in the betting phase');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);

            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];

            if (!player) {
                throw new Error('Player not found');
            }

            if (amount > player.balance) {
                throw new Error('Insufficient balance');
            }

            if (amount < gameState.options.tableLimits.minimumBet) {
                throw new Error(`Bet must be at least ${gameState.options.tableLimits.minimumBet}`);
            }

            if (amount > gameState.options.tableLimits.maximumBet) {
                throw new Error(`Bet cannot exceed ${gameState.options.tableLimits.maximumBet}`);
            }

            // Update player's bet and balance
            const updatedPlayers = [...gameState.players];
            const updatedPlayer: Player = {
                ...player,
                currentBet: amount,
                totalBet: amount,
                balance: player.balance - amount
            };

            updatedPlayers[playerIndex] = updatedPlayer;

            set({
                gameState: {
                    ...gameState,
                    players: updatedPlayers
                },
                isLoading: false,
                lastAction: `Player ${updatedPlayer.name} bet ${amount}`
            });

        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to place bet'
            });
        }
    },

    dealCards: () => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            if (gameState.currentPhase !== GAME_PHASES.BETTING) {
                throw new Error('Dealing is only allowed after the betting phase');
            }

            // Implementation for dealing cards
            // This would typically:
            // 1. Deal two cards to each player
            // 2. Deal two cards to the dealer (one face up, one face down)
            // 3. Update the game phase to 'playerTurn'

            // Example of using Card type
            const sampleCard = createSampleCard();
            console.log('Dealing cards including', sampleCard);

            set({
                gameState: {
                    ...gameState,
                    currentPhase: GAME_PHASES.PLAYER_TURN as GamePhase,
                    activePlayerIndex: 0,
                    activeHandIndex: 0
                },
                isLoading: false,
                lastAction: 'Cards dealt'
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to deal cards'
            });
        }
    },

    hit: (playerId, handId) => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];
            if (!player) {
                throw new Error('Player not found');
            }

            const handIndex = player.hands.findIndex(h => h.id === handId);
            if (handIndex === -1) {
                throw new Error('Hand not found');
            }

            // Implementation for hit action will be added here
            // This would typically:
            // 1. Deal one card to the specified hand
            // 2. Update hand values and status
            // 3. Check for bust or 21

            // Example of using Hand type
            const defaultHand = createDefaultHand();
            console.log('Default hand structure:', defaultHand);

            set({
                isLoading: false,
                lastAction: `Player ${player.name} hit on hand ${handId}`
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to hit'
            });
        }
    },

    stand: (playerId, handId) => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];
            if (!player) {
                throw new Error('Player not found');
            }

            const handIndex = player.hands.findIndex(h => h.id === handId);
            if (handIndex === -1) {
                throw new Error('Hand not found');
            }

            // Implementation for stand action
            // This would typically:
            // 1. Mark the hand as 'stood'
            // 2. Move to the next hand or player

            // Example of HandAction
            const handAction: HandAction = 'stand';
            console.log(`Performing action: ${handAction}`);

            set({
                isLoading: false,
                lastAction: `Player ${player.name} stood on hand ${handId}`
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to stand'
            });
        }
    },

    double: (playerId, handId) => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];
            if (!player) {
                throw new Error('Player not found');
            }

            const handIndex = player.hands.findIndex(h => h.id === handId);
            if (handIndex === -1) {
                throw new Error('Hand not found');
            }

            // Implementation for double action
            // This would typically:
            // 1. Double the bet
            // 2. Deal one more card
            // 3. Stand automatically

            set({
                isLoading: false,
                lastAction: `Player ${player.name} doubled on hand ${handId}`
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to double'
            });
        }
    },

    split: (playerId, handId) => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];
            if (!player) {
                throw new Error('Player not found');
            }

            const handIndex = player.hands.findIndex(h => h.id === handId);
            if (handIndex === -1) {
                throw new Error('Hand not found');
            }

            // Implementation for split action
            // This would typically:
            // 1. Create two new hands from the split pair
            // 2. Place an equal bet on the new hand
            // 3. Deal one additional card to each hand

            set({
                isLoading: false,
                lastAction: `Player ${player.name} split hand ${handId}`
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to split'
            });
        }
    },

    surrender: (playerId, handId) => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];
            if (!player) {
                throw new Error('Player not found');
            }

            const handIndex = player.hands.findIndex(h => h.id === handId);
            if (handIndex === -1) {
                throw new Error('Hand not found');
            }

            // Implementation for surrender action
            // This would typically:
            // 1. Return half the bet to the player
            // 2. Mark the hand as surrendered
            // 3. Move to the next hand or player

            set({
                isLoading: false,
                lastAction: `Player ${player.name} surrendered hand ${handId}`
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to surrender'
            });
        }
    },

    insurance: (playerId, handId, amount) => {
        const { gameState } = get();
        set({ isLoading: true });

        try {
            if (!gameState) {
                throw new Error('Game not initialized');
            }

            const playerIndex = gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            const player = gameState.players[playerIndex];
            if (!player) {
                throw new Error('Player not found');
            }

            const handIndex = player.hands.findIndex(h => h.id === handId);
            if (handIndex === -1) {
                throw new Error('Hand not found');
            }

            // Implementation for insurance action
            // This would typically:
            // 1. Place an insurance bet (up to half the original bet)
            // 2. Check dealer for blackjack and settle insurance accordingly

            set({
                isLoading: false,
                lastAction: `Player ${player.name} took insurance for ${amount} on hand ${handId}`
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to place insurance'
            });
        }
    },

    dealerPlay: () => {
        // Implementation for dealer's play will be added
        set({ lastAction: 'Dealer played' });
    },

    settleRound: () => {
        // Implementation for settling the round will be added
        set({ lastAction: 'Round settled' });
    },

    resetRound: () => {
        // Implementation for resetting the round will be added
        set({ lastAction: 'Round reset' });
    },

    endGame: () => {
        // Implementation for ending the game will be added
        set({ lastAction: 'Game ended' });
    }
}));

export default useGameStore;