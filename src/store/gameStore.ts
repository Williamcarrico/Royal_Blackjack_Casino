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
    chips: 1500, // Initialize with default player balance of 1500
    bet: 0,

    // Game state for normalized entity pattern
    entities: {
        hands: {},
        cards: {}
    },
    dealerHandId: null,
    activePlayerHandId: null,
    playerHandIds: [],
    shoe: [],
    dealtCards: [],
    runningCount: 0,
    trueCount: 0,
    gamePhase: 'betting',
    roundResult: null,
    message: 'Place your bet to begin',
    showInsurance: false,
    isInitialized: false,

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

            set({ isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load user chips'
            });
        }
    },

    // Add updateChips function to modify the chips value
    updateChips: (amount: number) => {
        set(state => ({
            chips: amount
        }));
    },

    // Helper functions for card operations
    createCard: (suit: string, rank: string, isFaceUp: boolean = true) => {
        const cardId = uuidv4();
        const card = {
            suit,
            rank
        };

        set(state => {
            // Add card to entities
            const updatedCards = { ...state.entities.cards };
            updatedCards[cardId] = card;

            return {
                entities: {
                    ...state.entities,
                    cards: updatedCards
                }
            };
        });

        return cardId;
    },

    // Creates a new deck of cards and shuffles them
    createShoe: (numberOfDecks = 6) => {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const unshuffledShoe: string[] = [];

        // Add cards to the shoe based on number of decks
        for (let deck = 0; deck < numberOfDecks; deck++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    const cardId = get().createCard(suit, rank);
                    unshuffledShoe.push(cardId);
                }
            }
        }

        // Shuffle the shoe
        const shuffledShoe = [...unshuffledShoe];
        for (let i = shuffledShoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledShoe[i], shuffledShoe[j]] = [shuffledShoe[j], shuffledShoe[i]];
        }

        set({ shoe: shuffledShoe, dealtCards: [] });

        // Calculate count values
        get().updateCount();

        return shuffledShoe;
    },

    // Deals a card from the shoe
    dealCard: (handId: string, isFaceUp: boolean = true) => {
        const state = get();
        if (state.shoe.length === 0) {
            throw new Error('Shoe is empty');
        }

        // Take the top card from the shoe
        const cardId = state.shoe[0];
        const updatedShoe = state.shoe.slice(1);
        const updatedDealtCards = [...state.dealtCards, cardId];

        // Update the hand with the new card
        const updatedHands = { ...state.entities.hands };
        if (updatedHands[handId]) {
            updatedHands[handId] = {
                ...updatedHands[handId],
                cards: [...updatedHands[handId].cards, cardId]
            };

            // Recalculate hand values
            const handValues = get().calculateHandValues(updatedHands[handId].cards);
            updatedHands[handId].values = handValues;
            updatedHands[handId].bestValue = get().determineBestValue(handValues);

            // Check for bust or blackjack
            if (updatedHands[handId].bestValue > 21) {
                updatedHands[handId].isBusted = true;
            }

            if (updatedHands[handId].cards.length === 2 && updatedHands[handId].bestValue === 21) {
                updatedHands[handId].isBlackjack = true;
            }
        }

        // Update state
        set({
            shoe: updatedShoe,
            dealtCards: updatedDealtCards,
            entities: {
                ...state.entities,
                hands: updatedHands
            }
        });

        // Update count
        get().updateCount();

        return cardId;
    },

    // Calculate hand values accounting for Aces
    calculateHandValues: (cardIds: string[]) => {
        const { entities } = get();
        const cards = cardIds.map(id => entities.cards[id]);

        // Initial value is 0
        let values = [0];
        let aceCount = 0;

        cards.forEach(card => {
            if (card.rank === 'A') {
                aceCount++;
                // For each existing value, add 1 for now (we'll handle extra 10 later)
                values = values.map(v => v + 1);
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                // Face cards are worth 10
                values = values.map(v => v + 10);
            } else {
                // Number cards
                values = values.map(v => v + parseInt(card.rank, 10));
            }
        });

        // Handle Aces that can be 11 without busting
        const results = [];
        for (const value of values) {
            results.push(value); // Always keep the current value

            // Try making each Ace worth 11 (add 10 since we already added 1)
            for (let i = 0; i < aceCount; i++) {
                if (value + 10 <= 21) {
                    results.push(value + 10);
                }
            }
        }

        // Remove duplicates and sort
        return [...new Set(results)].sort((a, b) => a - b);
    },

    // Get the best value for a hand (highest value that doesn't bust)
    determineBestValue: (values: number[]) => {
        const nonBustValues = values.filter(v => v <= 21);
        return nonBustValues.length > 0 ? Math.max(...nonBustValues) : Math.min(...values);
    },

    // Update the count based on dealt cards
    updateCount: () => {
        const { entities, dealtCards, shoe } = get();

        // Calculate running count
        let runningCount = 0;
        dealtCards.forEach(cardId => {
            const card = entities.cards[cardId];
            if (!card) return;

            // High-Lo counting system
            if (['2', '3', '4', '5', '6'].includes(card.rank)) {
                runningCount += 1; // Low cards increase the count
            } else if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) {
                runningCount -= 1; // High cards decrease the count
            }
            // 7, 8, 9 are neutral (0)
        });

        // Calculate true count (running count divided by decks remaining)
        const decksRemaining = shoe.length / 52;
        const trueCount = decksRemaining > 0 ? runningCount / decksRemaining : 0;

        set({
            runningCount,
            trueCount: parseFloat(trueCount.toFixed(2))
        });
    },

    initializeGame: () => {
        try {
            // Create initial game state
            const dealerHandId = uuidv4();
            const playerHandId = uuidv4();

            // Initialize empty hands
            const initialHands = {
                [dealerHandId]: {
                    id: dealerHandId,
                    cards: [],
                    values: [0],
                    bestValue: 0,
                    isBlackjack: false,
                    isBusted: false,
                    isSoft: false,
                    canSplit: false
                },
                [playerHandId]: {
                    id: playerHandId,
                    cards: [],
                    values: [0],
                    bestValue: 0,
                    isBlackjack: false,
                    isBusted: false,
                    isSoft: false,
                    canSplit: false,
                    bet: 0
                }
            };

            // Create and shuffle the shoe
            const shoe = get().createShoe(6);

            // Set initial game state
            set({
                entities: {
                    hands: initialHands,
                    cards: { ...get().entities.cards }
                },
                dealerHandId,
                activePlayerHandId: playerHandId,
                playerHandIds: [playerHandId],
                gamePhase: 'betting',
                roundResult: null,
                message: 'Place your bet to begin',
                bet: 0,
                isInitialized: true
            });

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to initialize game',
                isInitialized: false
            });
            return false;
        }
    },

    placeBet: (amount: number) => {
        try {
            const { chips, gamePhase, activePlayerHandId, entities } = get();

            // Validate game state
            if (gamePhase !== 'betting') {
                throw new Error('Cannot place bet outside betting phase');
            }

            // Validate bet amount
            if (amount <= 0) {
                throw new Error('Bet amount must be positive');
            }

            if (amount > chips) {
                throw new Error('Insufficient chips');
            }

            // Update player hand's bet and player chips
            if (activePlayerHandId && entities.hands[activePlayerHandId]) {
                const updatedHands = { ...entities.hands };
                updatedHands[activePlayerHandId] = {
                    ...updatedHands[activePlayerHandId],
                    bet: amount
                };

                set({
                    bet: amount,
                    chips: chips - amount,
                    entities: {
                        ...entities,
                        hands: updatedHands
                    },
                    message: `Bet placed: $${amount}. Press Deal to start.`
                });
            }

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to place bet',
                message: error instanceof Error ? error.message : 'Failed to place bet'
            });
            return false;
        }
    },

    clearBet: () => {
        try {
            const { bet, chips, gamePhase, activePlayerHandId, entities } = get();

            // Validate game state
            if (gamePhase !== 'betting') {
                throw new Error('Cannot clear bet outside betting phase');
            }

            if (bet <= 0) {
                return true; // No bet to clear
            }

            // Update player hand's bet and player chips
            if (activePlayerHandId && entities.hands[activePlayerHandId]) {
                const updatedHands = { ...entities.hands };
                updatedHands[activePlayerHandId] = {
                    ...updatedHands[activePlayerHandId],
                    bet: 0
                };

                set({
                    bet: 0,
                    chips: chips + bet,
                    entities: {
                        ...entities,
                        hands: updatedHands
                    },
                    message: 'Bet cleared. Place a new bet to begin.'
                });
            }

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to clear bet',
                message: error instanceof Error ? error.message : 'Failed to clear bet'
            });
            return false;
        }
    },

    dealCards: () => {
        try {
            const { bet, dealerHandId, activePlayerHandId, entities } = get();

            // Validate game state
            if (get().gamePhase !== 'betting') {
                throw new Error('Cannot deal cards outside betting phase');
            }

            if (bet <= 0) {
                throw new Error('Please place a bet before dealing');
            }

            // Deal two cards to player
            get().dealCard(activePlayerHandId!, true);
            get().dealCard(activePlayerHandId!, true);

            // Deal two cards to dealer (one face-down)
            get().dealCard(dealerHandId!, true); // Face-up card
            get().dealCard(dealerHandId!, true); // Face-down card in real game, but visible here for testing

            // Check for naturals (blackjacks)
            const playerHand = entities.hands[activePlayerHandId!];
            const dealerHand = entities.hands[dealerHandId!];

            // Update playerHand and dealerHand with current values after dealing
            const updatedHands = { ...get().entities.hands };
            const updatedPlayerHand = updatedHands[activePlayerHandId!];
            const updatedDealerHand = updatedHands[dealerHandId!];

            // Check for dealer blackjack - if dealer's up card is an Ace or 10-value card
            const dealerUpCardId = updatedDealerHand.cards[0];
            const dealerUpCard = get().entities.cards[dealerUpCardId];

            // Set game phase to player turn by default
            let newGamePhase = 'playerTurn';
            let newMessage = 'Your turn. Choose an action.';

            // Check if dealer has an Ace up, offer insurance
            if (dealerUpCard && dealerUpCard.rank === 'A') {
                set({ showInsurance: true });
                newMessage = 'Dealer has an Ace. Would you like insurance?';
            }

            // Check for blackjacks
            const playerValues = get().calculateHandValues(updatedPlayerHand.cards);
            const playerBestValue = get().determineBestValue(playerValues);
            const playerHasBlackjack = updatedPlayerHand.cards.length === 2 && playerBestValue === 21;

            const dealerValues = get().calculateHandValues(updatedDealerHand.cards);
            const dealerBestValue = get().determineBestValue(dealerValues);
            const dealerHasBlackjack = updatedDealerHand.cards.length === 2 && dealerBestValue === 21;

            // Update hand values
            updatedHands[activePlayerHandId!] = {
                ...updatedPlayerHand,
                values: playerValues,
                bestValue: playerBestValue,
                isBlackjack: playerHasBlackjack
            };

            updatedHands[dealerHandId!] = {
                ...updatedDealerHand,
                values: dealerValues,
                bestValue: dealerBestValue,
                isBlackjack: dealerHasBlackjack
            };

            // Handle blackjack scenarios
            if (playerHasBlackjack || dealerHasBlackjack) {
                // Both have blackjack
                if (playerHasBlackjack && dealerHasBlackjack) {
                    newGamePhase = 'settlement';
                    newMessage = 'Both have Blackjack! Push.';

                    // Return the player's original bet
                    set(state => ({
                        chips: state.chips + bet,
                        roundResult: 'push'
                    }));
                }
                // Player has blackjack
                else if (playerHasBlackjack) {
                    newGamePhase = 'settlement';
                    newMessage = 'Blackjack! You win 3:2.';

                    // Pay 3:2 for blackjack
                    set(state => ({
                        chips: state.chips + bet + (bet * 1.5),
                        roundResult: 'blackjack'
                    }));
                }
                // Dealer has blackjack
                else if (dealerHasBlackjack) {
                    newGamePhase = 'settlement';
                    newMessage = 'Dealer has Blackjack. You lose.';
                    set({ roundResult: 'lose' });
                }
            }

            // Update game state
            set({
                entities: {
                    ...get().entities,
                    hands: updatedHands
                },
                gamePhase: newGamePhase,
                message: newMessage
            });

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to deal cards',
                message: error instanceof Error ? error.message : 'Failed to deal cards'
            });
            return false;
        }
    },

    hit: () => {
        try {
            const { activePlayerHandId, entities } = get();

            // Validate game state
            if (get().gamePhase !== 'playerTurn') {
                throw new Error('Cannot hit outside player turn');
            }

            if (!activePlayerHandId || !entities.hands[activePlayerHandId]) {
                throw new Error('No active player hand');
            }

            // Deal a card to the player's hand
            get().dealCard(activePlayerHandId, true);

            // Get updated hand
            const updatedHand = get().entities.hands[activePlayerHandId];

            // Check if player busted
            if (updatedHand.bestValue > 21) {
                set({
                    gamePhase: 'settlement',
                    message: 'Bust! You lose.',
                    roundResult: 'bust'
                });
            } else if (updatedHand.bestValue === 21) {
                // Player reached 21, automatically stand
                get().stand();
            } else {
                set({
                    message: `You drew a card. Hand value: ${updatedHand.bestValue}`
                });
            }

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to hit',
                message: error instanceof Error ? error.message : 'Failed to hit'
            });
            return false;
        }
    },

    stand: () => {
        try {
            // Validate game state
            if (get().gamePhase !== 'playerTurn') {
                throw new Error('Cannot stand outside player turn');
            }

            // Move to dealer's turn
            set({
                gamePhase: 'dealerTurn',
                message: 'Player stands. Dealer\'s turn.'
            });

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to stand',
                message: error instanceof Error ? error.message : 'Failed to stand'
            });
            return false;
        }
    },

    doubleDown: () => {
        try {
            const { bet, chips, activePlayerHandId, entities } = get();

            // Validate game state
            if (get().gamePhase !== 'playerTurn') {
                throw new Error('Cannot double down outside player turn');
            }

            if (!activePlayerHandId || !entities.hands[activePlayerHandId]) {
                throw new Error('No active player hand');
            }

            const playerHand = entities.hands[activePlayerHandId];

            // Can only double down on first two cards
            if (playerHand.cards.length !== 2) {
                throw new Error('Can only double down on the first two cards');
            }

            // Check if player has enough chips
            if (chips < bet) {
                throw new Error('Insufficient chips to double down');
            }

            // Double the bet
            set({
                bet: bet * 2,
                chips: chips - bet,
                message: 'Double down! Bet doubled.'
            });

            // Deal one more card
            get().dealCard(activePlayerHandId, true);

            // Get updated hand
            const updatedHand = get().entities.hands[activePlayerHandId];

            // Check if player busted
            if (updatedHand.bestValue > 21) {
                set({
                    gamePhase: 'settlement',
                    message: 'Bust! You lose.',
                    roundResult: 'bust'
                });
            } else {
                // Move to dealer's turn
                set({
                    gamePhase: 'dealerTurn',
                    message: `Double down with ${updatedHand.bestValue}. Dealer's turn.`
                });
            }

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to double down',
                message: error instanceof Error ? error.message : 'Failed to double down'
            });
            return false;
        }
    },

    split: () => {
        // This method would implement splitting pairs
        // For now, we're returning a not-implemented error
        set({
            error: 'Split not implemented in this version',
            message: 'Split not implemented in this version'
        });
        return false;
    },

    surrender: () => {
        try {
            const { bet, chips, activePlayerHandId } = get();

            // Validate game state
            if (get().gamePhase !== 'playerTurn') {
                throw new Error('Cannot surrender outside player turn');
            }

            if (!activePlayerHandId) {
                throw new Error('No active player hand');
            }

            const playerHand = get().entities.hands[activePlayerHandId];

            // Can only surrender on first two cards
            if (playerHand.cards.length !== 2) {
                throw new Error('Can only surrender on the first two cards');
            }

            // Return half the bet
            set({
                chips: chips + (bet / 2),
                gamePhase: 'settlement',
                message: 'You surrendered. Half your bet is returned.',
                roundResult: 'surrender'
            });

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to surrender',
                message: error instanceof Error ? error.message : 'Failed to surrender'
            });
            return false;
        }
    },

    takeInsurance: () => {
        try {
            const { bet, chips, dealerHandId, entities } = get();

            // Validate game state
            if (!get().showInsurance) {
                throw new Error('Insurance not offered');
            }

            // Insurance costs half the original bet
            const insuranceBet = bet / 2;

            // Check if player has enough chips
            if (chips < insuranceBet) {
                throw new Error('Insufficient chips for insurance');
            }

            // Deduct insurance bet
            set({
                chips: chips - insuranceBet,
                showInsurance: false,
                message: 'Insurance taken.'
            });

            // Check if dealer has blackjack
            const dealerHand = entities.hands[dealerHandId!];

            // Get dealer's hole card
            const dealerCards = dealerHand.cards;
            if (dealerCards.length !== 2) {
                throw new Error('Dealer should have exactly 2 cards');
            }

            // Check if dealer's second card is a 10-value card (10, J, Q, K)
            const holeCardId = dealerCards[1];
            const holeCard = entities.cards[holeCardId];
            const isTenValueCard = ['10', 'J', 'Q', 'K'].includes(holeCard.rank);

            if (isTenValueCard) {
                // Dealer has blackjack (Ace up and 10-value hole card)
                // Insurance pays 2:1
                set(state => ({
                    chips: state.chips + insuranceBet * 3,
                    message: 'Dealer has Blackjack. Insurance pays 2:1.',
                    gamePhase: 'settlement',
                    roundResult: 'lose'
                }));

                // Reveal dealer's blackjack
                const updatedHands = { ...entities.hands };
                updatedHands[dealerHandId!] = {
                    ...updatedHands[dealerHandId!],
                    isRevealed: true,
                    isBlackjack: true
                };

                set({
                    entities: {
                        ...entities,
                        hands: updatedHands
                    }
                });
            } else {
                // Dealer doesn't have blackjack
                set({
                    message: 'Dealer does not have Blackjack. Insurance lost.',
                    gamePhase: 'playerTurn'
                });
            }

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to take insurance',
                message: error instanceof Error ? error.message : 'Failed to take insurance'
            });
            return false;
        }
    },

    declineInsurance: () => {
        set({
            showInsurance: false,
            message: 'Insurance declined.',
            gamePhase: 'playerTurn'
        });

        return true;
    },

    playDealer: () => {
        try {
            const { dealerHandId, entities } = get();

            // Validate game state
            if (get().gamePhase !== 'dealerTurn') {
                throw new Error('Cannot play dealer outside dealer turn');
            }

            if (!dealerHandId || !entities.hands[dealerHandId]) {
                throw new Error('No dealer hand');
            }

            // Reveal all dealer cards first
            set(state => {
                const updatedHands = { ...state.entities.hands };
                updatedHands[dealerHandId] = {
                    ...updatedHands[dealerHandId],
                    isRevealed: true
                };

                return {
                    entities: {
                        ...state.entities,
                        hands: updatedHands
                    },
                    message: 'Dealer reveals hole card.'
                };
            });

            // Get updated dealer hand
            let dealerHand = get().entities.hands[dealerHandId];
            let dealerValue = dealerHand.bestValue;

            // Check if dealer has soft 17 (Ace counted as 11 with total of 17)
            const hasSoft17 = () => {
                const cardIds = dealerHand.cards;
                const cards = cardIds.map(id => get().entities.cards[id]);

                // Check if hand contains an Ace
                const containsAce = cards.some(card => card.rank === 'A');

                // A soft 17 is a hand with an Ace that could be counted as 1 or 11
                if (dealerValue === 17 && containsAce) {
                    // Calculate value counting all Aces as 1
                    const hardValue = cards.reduce((sum, card) => {
                        if (card.rank === 'A') {
                            return sum + 1; // Count Ace as 1
                        } else if (['J', 'Q', 'K'].includes(card.rank)) {
                            return sum + 10;
                        } else {
                            return sum + parseInt(card.rank, 10);
                        }
                    }, 0);

                    // If total is less than 17, then at least one Ace is counted as 11
                    return hardValue < 17;
                }

                return false;
            };

            // Dealer must hit on soft 17 (Ace and 6)
            const dealerHitsSoft17 = true; // This could be a rule setting

            // Wait between dealer actions
            const dealerActionDelay = 1000; // ms

            const dealerAction = () => {
                // Update with latest state
                dealerHand = get().entities.hands[dealerHandId];
                dealerValue = dealerHand.bestValue;

                // Dealer stands on hard 17 or higher
                // If hitSoft17 is true, dealer must hit on soft 17
                const shouldHit = dealerValue < 17 || (dealerHitsSoft17 && hasSoft17());

                if (shouldHit) {
                    set({ message: `Dealer hits with ${dealerValue}.` });

                    // Deal a card to the dealer
                    get().dealCard(dealerHandId, true);

                    // Check if dealer busted
                    dealerHand = get().entities.hands[dealerHandId];
                    dealerValue = dealerHand.bestValue;

                    if (dealerValue > 21) {
                        set({
                            message: `Dealer busts with ${dealerValue}!`,
                            gamePhase: 'settlement'
                        });

                        // End the round with dealer bust
                        setTimeout(() => {
                            get().endRound();
                        }, dealerActionDelay);

                        return;
                    }

                    // Continue dealer actions after delay
                    setTimeout(dealerAction, dealerActionDelay);
                } else {
                    // Dealer stands
                    set({
                        message: `Dealer stands with ${dealerValue}.`,
                        gamePhase: 'settlement'
                    });

                    // End the round with dealer decision
                    setTimeout(() => {
                        get().endRound();
                    }, dealerActionDelay);
                }
            };

            // Start dealer actions with a delay
            setTimeout(dealerAction, dealerActionDelay);

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to play dealer',
                message: error instanceof Error ? error.message : 'Failed to play dealer'
            });
            return false;
        }
    },

    endRound: () => {
        try {
            const { activePlayerHandId, dealerHandId, bet, chips, entities } = get();

            // Validate game state
            if (get().gamePhase !== 'settlement') {
                set({ gamePhase: 'settlement' });
            }

            if (!activePlayerHandId || !dealerHandId) {
                throw new Error('Missing player or dealer hand');
            }

            const playerHand = entities.hands[activePlayerHandId];
            const dealerHand = entities.hands[dealerHandId];

            // Skip result calculation if already determined (blackjack, bust, etc.)
            if (get().roundResult) {
                return true;
            }

            // Player busted
            if (playerHand.bestValue > 21) {
                set({
                    message: 'Bust! You lose.',
                    roundResult: 'bust'
                });
                return true;
            }

            // Dealer busted
            if (dealerHand.bestValue > 21) {
                set({
                    chips: chips + bet * 2,
                    message: 'Dealer busts! You win.',
                    roundResult: 'win'
                });
                return true;
            }

            // Compare hands
            if (playerHand.bestValue > dealerHand.bestValue) {
                set({
                    chips: chips + bet * 2,
                    message: `You win with ${playerHand.bestValue} against dealer's ${dealerHand.bestValue}.`,
                    roundResult: 'win'
                });
            } else if (playerHand.bestValue < dealerHand.bestValue) {
                set({
                    message: `You lose with ${playerHand.bestValue} against dealer's ${dealerHand.bestValue}.`,
                    roundResult: 'lose'
                });
            } else {
                set({
                    chips: chips + bet,
                    message: `Push with ${playerHand.bestValue}.`,
                    roundResult: 'push'
                });
            }

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to end round',
                message: error instanceof Error ? error.message : 'Failed to end round'
            });
            return false;
        }
    },

    resetRound: () => {
        try {
            const { dealerHandId, activePlayerHandId } = get();

            // Create new hands
            const newDealerHandId = uuidv4();
            const newPlayerHandId = uuidv4();

            // Initialize empty hands
            const newHands = {
                [newDealerHandId]: {
                    id: newDealerHandId,
                    cards: [],
                    values: [0],
                    bestValue: 0,
                    isBlackjack: false,
                    isBusted: false,
                    isSoft: false,
                    canSplit: false
                },
                [newPlayerHandId]: {
                    id: newPlayerHandId,
                    cards: [],
                    values: [0],
                    bestValue: 0,
                    isBlackjack: false,
                    isBusted: false,
                    isSoft: false,
                    canSplit: false,
                    bet: 0
                }
            };

            // Check if we need to reshuffle
            let updatedShoe = [...get().shoe];
            if (updatedShoe.length < 52) { // Reshuffle when less than 1 deck remains
                updatedShoe = get().createShoe(6);
            }

            // Reset game state for new round
            set({
                entities: {
                    cards: { ...get().entities.cards }, // Keep existing cards
                    hands: newHands
                },
                dealerHandId: newDealerHandId,
                activePlayerHandId: newPlayerHandId,
                playerHandIds: [newPlayerHandId],
                gamePhase: 'betting',
                roundResult: null,
                message: 'Place your bet to begin',
                bet: 0,
                showInsurance: false
            });

            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to reset round',
                message: error instanceof Error ? error.message : 'Failed to reset round'
            });
            return false;
        }
    },

    // Helper function to check if double down is available
    canDoubleDown: () => {
        const { gamePhase, activePlayerHandId, entities } = get();

        if (gamePhase !== 'playerTurn' || !activePlayerHandId) {
            return false;
        }

        const playerHand = entities.hands[activePlayerHandId];
        if (!playerHand) {
            return false;
        }

        // Can only double down on first two cards
        return playerHand.cards.length === 2;
    },

    // Helper function to check if split is available
    canSplit: () => {
        const { gamePhase, activePlayerHandId, entities } = get();

        if (gamePhase !== 'playerTurn' || !activePlayerHandId) {
            return false;
        }

        const playerHand = entities.hands[activePlayerHandId];
        if (!playerHand || playerHand.cards.length !== 2) {
            return false;
        }

        // Check if the cards have the same rank
        const card1Id = playerHand.cards[0];
        const card2Id = playerHand.cards[1];
        const card1 = entities.cards[card1Id];
        const card2 = entities.cards[card2Id];

        return card1.rank === card2.rank;
    },

    // Helper function to check if surrender is available
    canSurrender: () => {
        const { gamePhase, activePlayerHandId, entities } = get();

        if (gamePhase !== 'playerTurn' || !activePlayerHandId) {
            return false;
        }

        const playerHand = entities.hands[activePlayerHandId];
        if (!playerHand) {
            return false;
        }

        // Can only surrender on first two cards
        return playerHand.cards.length === 2;
    },

    // Update game rules
    updateRules: (rules) => {
        // This would implement rule changes
        // For this version, we'll just acknowledge the call
        set({
            message: 'Rules updated.'
        });
        return true;
    }
}));

export default useGameStore;