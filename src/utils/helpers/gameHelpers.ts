/**
 * Game helper functions for the blackjack game
 */

import type { Card, Hand, RoundResult, GamePhase, GameRules } from '@/types/gameTypes';
import { UIGamePhase } from '@/types/gameTypes';
import { isBlackjack, getBestHandValue, calculateHandValues, isBust } from '@/lib/helpers/cardHelpers';
import { calculatePayout } from '@/lib/helpers/betHelpers';
import { VEGAS_RULES } from '@/lib/constants/gameConstants';
import { nanoid } from 'nanoid';

/**
 * Interface for game state
 */
export interface GameState {
    entities: {
        hands: Record<string, Hand>;
        cards: Record<string, Card>;
    };
    dealerHandId: string;
    playerHandIds: string[];
    activePlayerHandId: string | null;
    shoe: Card[];
    dealtCards: Card[];
    runningCount: number;
    trueCount: number;
    gamePhase: GamePhase;
    message: string;
    chips: number;
    bet: number;
    roundResult: RoundResult | null;
    handResults: Record<string, RoundResult | null>;
    gameRules: GameRules;
    isDoubleDownAvailable: boolean;
    isSplitAvailable: boolean;
    insuranceAvailable: boolean;
    sideBets: Array<Record<string, unknown>>;
    currentSideBetsTotal: number;
    gameStats: GameStats;
    actionHistory: string[];
    userId: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Interface for game statistics
 */
export interface GameStats {
    handsPlayed: number;
    handsWon: number;
    handsLost: number;
    pushes: number;
    blackjacks: number;
    busts: number;
    biggestWin: number;
    startingChips: number;
    endingChips: number;
    sessionStart: Date;
}

/**
 * Extracts card array from either Hand object or Card array
 */
const extractCards = (hand: Hand | Card[]): Card[] => {
    if (Array.isArray(hand)) {
        return hand;
    }

    // Safe way to extract cards without complex type predicates
    if ('cards' in hand && Array.isArray(hand.cards)) {
        return hand.cards;
    }

    return [];
};

/**
 * Checks if a hand is busted
 */
const checkBust = (hand: Hand | Card[]): boolean => {
    return 'isBusted' in hand ? hand.isBusted : isBust(extractCards(hand));
};

/**
 * Checks if a hand has blackjack
 */
const checkBlackjack = (hand: Hand | Card[]): boolean => {
    return 'isBlackjack' in hand ? hand.isBlackjack : isBlackjack(extractCards(hand));
};

/**
 * Gets the best value for a hand
 */
const getHandValue = (hand: Hand | Card[]): number => {
    if ('values' in hand) {
        return Math.max(...hand.values.filter((v: number) => v <= 21), 0);
    }
    return getBestHandValue(extractCards(hand));
};

/**
 * Determines the result of a blackjack hand
 * @param playerHand The player's hand
 * @param dealerHand The dealer's hand
 * @returns The result of the round
 */
export const determineRoundResult = (
    playerHand: Hand | Card[],
    dealerHand: Hand | Card[]
): RoundResult => {
    // Check if player busted
    if (checkBust(playerHand)) {
        return 'bust';
    }

    // Check for blackjacks
    const playerHasBlackjack = checkBlackjack(playerHand);
    const dealerHasBlackjack = checkBlackjack(dealerHand);

    // Handle blackjack scenarios
    if (playerHasBlackjack && dealerHasBlackjack) return 'push';
    if (playerHasBlackjack) return 'blackjack';
    if (dealerHasBlackjack) return 'loss';

    // Check if dealer busted
    if (checkBust(dealerHand)) {
        return 'win';
    }

    // Compare hand values
    const playerValue = getHandValue(playerHand);
    const dealerValue = getHandValue(dealerHand);

    if (playerValue > dealerValue) return 'win';
    if (dealerValue > playerValue) return 'loss';
    return 'push';
};

/**
 * Simulates the dealer's turn
 * @param dealerHand The dealer's current hand
 * @param shoe The current shoe of cards
 * @param hitSoft17 Whether the dealer hits on soft 17
 * @returns The dealer's final hand and updated shoe
 */
export const playDealerHandToCompletion = (
    dealerHand: Hand | Card[],
    shoe: Card[],
    hitSoft17 = true
): { hand: Hand; updatedShoe: Card[] } => {
    // Create a deep copy of the shoe
    const updatedShoe = [...shoe];

    // Handle different input types
    let dealerCards: Card[];
    if (Array.isArray(dealerHand)) {
        dealerCards = [...dealerHand];
    } else {
        dealerCards = Array.isArray(dealerHand.cards)
            ? [...dealerHand.cards]
            : [];
    }

    // Flip all cards face up
    dealerCards = dealerCards.map(card => ({ ...card, faceUp: true }));

    // Calculate current hand value
    let handValues = calculateHandValues(dealerCards);
    let bestValue = Math.max(...handValues.filter((v: number) => v <= 21), 0);
    let isSoft = handValues.length > 1 && dealerCards.some(card => card.value === 'A');

    // Dealer draws until reaching 17 or higher
    while (bestValue < 17 || (hitSoft17 && isSoft && bestValue === 17)) {
        // No more cards in shoe
        if (updatedShoe.length === 0) {
            break;
        }

        // Deal a card
        const poppedCard = updatedShoe.pop();
        if (poppedCard) {
            const newCard = { ...poppedCard, faceUp: true };
            dealerCards.push(newCard);
        }

        // Recalculate hand value
        handValues = calculateHandValues(dealerCards);
        bestValue = Math.max(...handValues.filter((v: number) => v <= 21), 0);
        isSoft = handValues.length > 1 && dealerCards.some(card => card.value === 'A');
    }

    // Create a Hand object for the dealer
    const finalHand: Hand = {
        id: 'dealer',
        cards: dealerCards.map(card => card.id || nanoid()),
        values: handValues,
        isBlackjack: isBlackjack(dealerCards),
        isBusted: handValues.every((v: number) => v > 21),
        isSoft,
        canSplit: false
    };

    return { hand: finalHand, updatedShoe };
};

/**
 * Calculates the running count based on visible cards
 * @param cards Array of visible cards
 * @returns The running count
 */
export const calculateRunningCount = (cards: Card[]): number => {
    let count = 0;

    for (const card of cards) {
        // Skip face-down cards
        if (!card.faceUp) continue;

        // Hi-Lo counting system
        const value = parseInt(card.value);

        if (value >= 2 && value <= 6) {
            count++; // Low cards increase the count
        } else if (value >= 10 || card.value === 'A' ||
            card.value === 'J' || card.value === 'Q' ||
            card.value === 'K') {
            count--; // High cards decrease the count
        }
        // 7, 8, 9 are neutral (count doesn't change)
    }

    return count;
};

/**
 * Calculates the true count based on running count and remaining decks
 * @param runningCount The current running count
 * @param remainingDecks The number of remaining decks
 * @returns The true count
 */
export const calculateTrueCount = (
    runningCount: number,
    remainingDecks: number
): number => {
    if (remainingDecks <= 0) return 0;
    return runningCount / remainingDecks;
};

/**
 * Checks if an action is allowed in the current game phase
 * @param action The action to check
 * @param gamePhase The current game phase
 * @returns Whether the action is allowed
 */
export const isActionAllowed = (
    action: string,
    gamePhase: GamePhase
): boolean => {
    const allowedActions: Record<GamePhase, string[]> = {
        [UIGamePhase.Betting]: ['placeBet', 'increaseBet', 'clearBet', 'placeSideBet', 'clearSideBet', 'dealCards'],
        [UIGamePhase.Dealing]: [],
        [UIGamePhase.PlayerTurn]: ['hit', 'stand', 'doubleDown', 'split', 'surrender', 'takeInsurance', 'declineInsurance'],
        [UIGamePhase.DealerTurn]: ['playDealer'],
        [UIGamePhase.Settlement]: ['endRound'],
        [UIGamePhase.Completed]: ['resetRound', 'resetGame'],
        [UIGamePhase.Error]: ['clearError', 'resetGame'],
        [UIGamePhase.Cleanup]: ['resetRound', 'resetGame']
    };

    return allowedActions[gamePhase]?.includes(action) || false;
};

/**
 * Gets all possible next game phases based on current phase
 * @param currentPhase The current game phase
 * @returns Array of possible next phases
 */
export const getPossibleNextPhases = (currentPhase: GamePhase): GamePhase[] => {
    const phaseTransitions: Record<GamePhase, GamePhase[]> = {
        [UIGamePhase.Betting]: [UIGamePhase.Dealing, UIGamePhase.Error],
        [UIGamePhase.Dealing]: [UIGamePhase.PlayerTurn, UIGamePhase.Settlement, UIGamePhase.Error],
        [UIGamePhase.PlayerTurn]: [UIGamePhase.DealerTurn, UIGamePhase.Settlement, UIGamePhase.Error],
        [UIGamePhase.DealerTurn]: [UIGamePhase.Settlement, UIGamePhase.Error],
        [UIGamePhase.Settlement]: [UIGamePhase.Completed, UIGamePhase.Error],
        [UIGamePhase.Completed]: [UIGamePhase.Betting, UIGamePhase.Error],
        [UIGamePhase.Error]: [UIGamePhase.Betting],
        [UIGamePhase.Cleanup]: [UIGamePhase.Betting]
    };

    return phaseTransitions[currentPhase] || [];
};

/**
 * Checks if a phase transition is valid
 * @param currentPhase The current game phase
 * @param nextPhase The next game phase
 * @returns Whether the transition is valid
 */
export const isValidPhaseTransition = (
    currentPhase: GamePhase,
    nextPhase: GamePhase
): boolean => {
    const validTransitions = getPossibleNextPhases(currentPhase);
    return validTransitions.includes(nextPhase);
};

/**
 * Gets appropriate message for current game state
 * @param gamePhase The current game phase
 * @param roundResult The result of the round
 * @param playerHand The player's hand
 * @param _dealerHand The dealer's hand (intentionally unused)
 * @returns A message describing the current state
 */
export const getGameStateMessage = (
    gamePhase: GamePhase,
    roundResult: RoundResult | null,
    playerHand?: Hand | null,
    _dealerHand?: Hand | null
): string => {
    // Handle different phases
    switch (gamePhase) {
        case 'betting':
            return 'Place your bet to begin the game.';

        case 'dealing':
            return 'Dealing cards...';

        case 'playerTurn':
            if (playerHand?.isBlackjack) {
                return 'Blackjack! Waiting for dealer to check hole card.';
            }
            return 'Your turn. Hit, stand, or make another move.';

        case 'dealerTurn':
            return "Dealer's turn...";

        case 'settlement':
            // Handle different round results
            if (!roundResult) return 'Determining result...';

            switch (roundResult) {
                case 'blackjack':
                    return 'Blackjack! You win!';

                case 'win':
                    return 'You win!';

                case 'push':
                    return 'Push. Your bet is returned.';

                case 'loss':
                    return 'Dealer wins.';

                case 'bust':
                    return 'Bust! You lose.';

                case 'surrender':
                    return 'Hand surrendered. Half your bet is returned.';

                default:
                    return 'Hand completed.';
            }

        case 'completed':
            return 'Round completed. Place a new bet to play again.';

        case 'error':
            return 'An error occurred. Please try again.';

        default:
            return 'Welcome to Blackjack!';
    }
};

/**
 * Calculates the win/loss for a hand
 * @param result The result of the hand
 * @param bet The bet amount
 * @param blackjackPayout The blackjack payout multiplier (default 1.5)
 * @returns The profit/loss amount
 */
export const calculateHandProfit = (
    result: RoundResult | null,
    bet: number,
    blackjackPayout = 1.5
): number => {
    if (!result) return 0;

    const payout = calculatePayout(bet, result, blackjackPayout);
    return payout - bet;
};

/**
 * Creates a new initial game state
 * @param startingChips The starting number of chips
 * @param rules Optional custom game rules
 * @returns A new game state object
 */
export const createInitialGameState = (
    startingChips: number,
    rules: GameRules = VEGAS_RULES
): GameState => {
    // Create initial dealer hand
    const dealerHandId = nanoid();

    return {
        entities: {
            hands: {
                [dealerHandId]: {
                    id: dealerHandId,
                    cards: [],
                    values: [0],
                    isBlackjack: false,
                    isBusted: false,
                    isSoft: false,
                    canSplit: false
                }
            },
            cards: {}
        },
        dealerHandId,
        playerHandIds: [],
        activePlayerHandId: null,
        shoe: [],
        dealtCards: [],
        runningCount: 0,
        trueCount: 0,
        gamePhase: UIGamePhase.Betting,
        message: 'Welcome to Blackjack! Place your bet to begin.',
        chips: startingChips,
        bet: 0,
        roundResult: null,
        handResults: {},
        gameRules: rules,
        isDoubleDownAvailable: false,
        isSplitAvailable: false,
        insuranceAvailable: false,
        sideBets: [],
        currentSideBetsTotal: 0,
        gameStats: {
            handsPlayed: 0,
            handsWon: 0,
            handsLost: 0,
            pushes: 0,
            blackjacks: 0,
            busts: 0,
            biggestWin: 0,
            startingChips,
            endingChips: startingChips,
            sessionStart: new Date()
        },
        actionHistory: [],
        userId: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        error: null
    };
};

/**
 * Converts a hand result to a displayable string
 * @param result The hand result
 * @returns A human-readable result string
 */
export const getDisplayResultText = (result: RoundResult | null): string => {
    if (!result) return '';

    const resultMap: Record<string, string> = {
        'blackjack': 'BLACKJACK!',
        'win': 'WIN',
        'push': 'PUSH',
        'loss': 'LOSS',
        'bust': 'BUST',
        'surrender': 'SURRENDERED',
        'insurance': 'INSURANCE PAID',
        'pending': 'IN PROGRESS'
    };

    return resultMap[result] ?? result;
};

/**
 * Gets an appropriate CSS class for a result
 * @param result The hand result
 * @returns CSS class name
 */
export const getResultClass = (result: RoundResult | null): string => {
    if (!result) return '';

    const classMap: Record<string, string> = {
        'blackjack': 'text-amber-500 font-bold',
        'win': 'text-green-500',
        'push': 'text-blue-500',
        'loss': 'text-red-500',
        'bust': 'text-red-500',
        'surrender': 'text-gray-500',
        'insurance': 'text-blue-500',
        'pending': 'text-gray-400'
    };

    return classMap[result] ?? '';
};

/**
 * Gets the next player hand to act on
 * @param playerHandIds Array of all player hand IDs
 * @param currentHandId Current active hand ID
 * @returns The next hand ID or null if no more hands
 */
export const getNextPlayerHand = (
    playerHandIds: string[],
    currentHandId: string | null
): string | null => {
    if (!currentHandId || !playerHandIds.length) return null;

    const currentIndex = playerHandIds.indexOf(currentHandId);
    if (currentIndex === -1 || currentIndex === playerHandIds.length - 1) {
        return null;
    }

    return playerHandIds[currentIndex + 1];
};

/**
 * Records a game action for analytics
 * @param action The action performed
 * @param gameState The current game state
 * @returns Updated action history
 */
export const recordGameAction = (action: string, gameState: GameState): string[] => {
    const actionWithTimestamp = `${action}:${Date.now()}`;
    return [...gameState.actionHistory, actionWithTimestamp];
};

/**
 * Creates a formatted game summary
 * @param gameStats The game statistics object
 * @returns A formatted summary string
 */
export const createGameSummary = (gameStats: GameStats): string => {
    const { handsPlayed, handsWon, pushes, blackjacks, busts, startingChips, endingChips } = gameStats;

    const netProfit = endingChips - startingChips;
    const winPercentage = handsPlayed > 0 ? (handsWon / handsPlayed) * 100 : 0;

    return `Session Summary
  • Hands Played: ${handsPlayed}
  • Hands Won: ${handsWon} (${winPercentage.toFixed(1)}%)
  • Blackjacks: ${blackjacks}
  • Pushes: ${pushes}
  • Busts: ${busts}
  • Net Profit: ${netProfit >= 0 ? '+' : ''}${netProfit}
  • Starting Chips: ${startingChips}
  • Ending Chips: ${endingChips}`;
};