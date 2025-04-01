/**
 * Game engine with core game logic for blackjack
 */
import { v4 as uuidv4 } from 'uuid';
import { GameState, GameOptions, GameAction, GameRound } from '../../types/gameTypes';
import { Card, Shoe } from '../../types/cardTypes';
import { Hand, DealerHand, HandAction, HandStatus, HandResult } from '../../types/handTypes';
import { Bet } from '../../types/betTypes';

// Define enum values to match their type definitions
export enum LocalHandStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    BUSTED = 'busted',
    STAND = 'stand',
    SURRENDERED = 'surrendered'
}

export enum LocalGameStatus {
    IDLE = 'idle',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    PAUSED = 'paused'
}

export enum LocalGamePhase {
    BETTING = 'betting',
    DEAL = 'deal',
    PLAYER_TURN = 'playerTurn',
    DEALER_TURN = 'dealerTurn',
    SETTLEMENT = 'settlement',
    CLEANUP = 'cleanup'
}

// Create type aliases
export type { GameRound, Bet };

/**
 * Creates an initial empty game state
 */
export const createInitialGameState = (options: GameOptions): GameState => {
    // Create empty shoe
    const shoe: Shoe = {
        id: uuidv4(),
        decks: [],
        cards: [],
        remaining: 0,
        penetration: options.penetration,
        cutCardPosition: 0,
        isShuffled: false
    };

    // Create empty dealer hand
    const dealerHand: DealerHand = {
        id: uuidv4(),
        cards: [],
        values: [0],
        bestValue: 0,
        status: LocalHandStatus.ACTIVE,
        hasHiddenCard: false
    };

    // Create game state
    return {
        id: uuidv4(),
        status: LocalGameStatus.IDLE,
        currentPhase: LocalGamePhase.BETTING,
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
        history: [] as GameRound[],
        // Add missing properties from GameState type
        decks: [],
        lastShuffle: new Date(),
        deckPenetration: options.penetration || 0.75
    };
};

/**
 * Calculate all possible values for a hand (accounting for Aces)
 */
export const calculateHandValues = (cards: Card[]): number[] => {
    // Initial value is 0
    let values = [0];

    cards.forEach(card => {
        // For regular number cards
        if (typeof card.value === 'number') {
            values = values.map(v => v + (card.value as number));
        }
        // For Aces (which can be 1 or 11)
        else if (Array.isArray(card.value)) {
            const [lowValue, highValue] = card.value;

            // For each existing value, create two new possibilities
            const newValues: number[] = [];

            values.forEach(value => {
                newValues.push(value + (lowValue ?? 1));  // Add low value
                newValues.push(value + (highValue ?? 11)); // Add high value
            });

            // Remove duplicates and update values
            values = Array.from(new Set(newValues));
        }
    });

    // Sort values ascending
    return values.sort((a, b) => a - b);
};

/**
 * Determine the best value for a hand
 * The best value is the highest value that doesn't exceed 21
 */
export const determineBestValue = (values: number[]): number => {
    // Filter values that don't exceed 21
    const validValues = values.filter(v => v <= 21);

    // Return the highest valid value, or the lowest value if all are busts
    return validValues.length > 0
        ? Math.max(...validValues)
        : Math.min(...values);
};

/**
 * Check if a hand is a blackjack (21 with exactly 2 cards)
 */
export const isBlackjack = (hand: Hand | DealerHand): boolean => {
    return hand.cards.length === 2 && hand.bestValue === 21;
};

/**
 * Check if a hand is busted (value exceeds 21)
 */
export const isBusted = (hand: Hand | DealerHand): boolean => {
    return hand.bestValue > 21;
};

/**
 * Check if a hand is soft (contains an Ace counted as 11)
 */
export const isSoft = (hand: Hand | DealerHand): boolean => {
    // Calculate value treating all Aces as 1
    const hardValue = hand.cards.reduce((sum, card) => {
        if (Array.isArray(card.value)) {
            return sum + (card.value[0] ?? 1); // Add low value for Aces
        }
        return sum + card.value;
    }, 0);

    // If best value is higher than hard value, hand must be soft
    return hand.bestValue > hardValue;
};

/**
 * Determine if dealer should hit or stand
 * Based on dealer rules (hit on soft 17 or stand on all 17s)
 */
export const shouldDealerHit = (dealerHand: DealerHand, hitSoft17: boolean): boolean => {
    const { bestValue } = dealerHand;

    // Always hit on 16 or less
    if (bestValue < 17) {
        return true;
    }

    // Always stand on hard 18+
    if (bestValue > 17) {
        return false;
    }

    // For 17, depends on whether it's soft and rule setting
    if (bestValue === 17) {
        // If it's a soft 17 and rule is to hit soft 17, then hit
        return hitSoft17 && isSoft(dealerHand as Hand | DealerHand);
    }

    return false;
};

/**
 * Get available actions for a hand based on its current state and rules
 */
export const getAvailableActions = (
    hand: Hand,
    dealerUpCard?: Card,
    options?: GameOptions
): HandAction[] => {
    const actions: HandAction[] = [];

    // If hand is not active, no actions are available
    if (hand.status !== LocalHandStatus.ACTIVE) {
        return actions;
    }

    // Default options if not provided
    const gameOptions = options || {
        doubleAfterSplit: true,
        resplitAces: false,
        lateSurrender: true,
        maxSplitHands: 4,
        allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
        // ... other options with default values
    } as GameOptions;

    const { allowedActions } = gameOptions;
    const isFirstTwoCards = hand.cards.length === 2;

    // Add basic actions
    addBasicActions(actions, allowedActions);

    // Add conditional actions
    if (isFirstTwoCards) {
        addDoubleAction(actions, hand, allowedActions, gameOptions);
        addSplitAction(actions, hand, allowedActions, gameOptions);
        addSurrenderAction(actions, allowedActions, gameOptions);
        addInsuranceAction(actions, allowedActions, dealerUpCard);
    }

    return actions;
};

// Helper functions to reduce complexity
const addBasicActions = (actions: HandAction[], allowedActions: string[]): void => {
    if (allowedActions.includes('hit')) actions.push('hit');
    if (allowedActions.includes('stand')) actions.push('stand');
};

const addDoubleAction = (
    actions: HandAction[],
    hand: Hand,
    allowedActions: string[],
    gameOptions: GameOptions
): void => {
    const canDouble = allowedActions.includes('double') &&
        !hand.isDoubled &&
        (hand.isSplit ? gameOptions.doubleAfterSplit : true);

    if (canDouble) {
        actions.push('double');
    }
};

const addSplitAction = (
    actions: HandAction[],
    hand: Hand,
    allowedActions: string[],
    gameOptions: GameOptions
): void => {
    const isPair = hand.cards[0]?.rank === hand.cards[1]?.rank;

    if (!allowedActions.includes('split') || !isPair) {
        return;
    }

    // Cannot split if already at max split hands
    const isSplitHandLimitReached = false; // This would need to be determined from game state

    // Cannot split Aces again unless resplitAces is allowed
    const isResplittingAces = hand.cards[0]?.rank === 'A' && hand.isSplit && !gameOptions.resplitAces;

    if (!isSplitHandLimitReached && !isResplittingAces) {
        actions.push('split');
    }
};

const addSurrenderAction = (
    actions: HandAction[],
    allowedActions: string[],
    gameOptions: GameOptions
): void => {
    if (allowedActions.includes('surrender') && gameOptions.lateSurrender) {
        actions.push('surrender');
    }
};

const addInsuranceAction = (
    actions: HandAction[],
    allowedActions: string[],
    dealerUpCard?: Card
): void => {
    if (allowedActions.includes('insurance') && dealerUpCard && dealerUpCard.rank === 'A') {
        actions.push('insurance');
    }
};

/**
 * Compare dealer and player hands to determine the result
 */
export const compareHands = (playerHand: Hand, dealerHand: DealerHand): HandResult => {
    // Check for blackjack
    const playerHasBlackjack = isBlackjack(playerHand);
    const dealerHasBlackjack = isBlackjack(dealerHand as Hand | DealerHand);

    // If player busted, they lose regardless of dealer's hand
    if (isBusted(playerHand)) {
        return 'loss';
    }

    // If dealer busted, player wins
    if (isBusted(dealerHand as Hand | DealerHand)) {
        return 'win';
    }

    // Both have blackjack = push
    if (playerHasBlackjack && dealerHasBlackjack) {
        return 'push';
    }

    // Player has blackjack but dealer doesn't = blackjack win
    if (playerHasBlackjack && !dealerHasBlackjack) {
        return 'blackjack';
    }

    // Dealer has blackjack but player doesn't = loss
    if (!playerHasBlackjack && dealerHasBlackjack) {
        return 'loss';
    }

    // Compare hand values
    if (playerHand.bestValue > dealerHand.bestValue) {
        return 'win';
    } else if (playerHand.bestValue < dealerHand.bestValue) {
        return 'loss';
    } else {
        return 'push';
    }
};

/**
 * Calculate the payout amount for a bet based on the hand result
 */
export const calculatePayout = (bet: Bet | number, result: HandResult, blackjackPayout: number = 1.5): number => {
    // Convert Bet object to number if needed
    const betAmount = typeof bet === 'number' ? bet : bet.amount;

    switch (result) {
        case 'win':
            return betAmount * 2; // Original bet + 1:1 win
        case 'blackjack':
            return betAmount * (1 + blackjackPayout); // Original bet + blackjack payout (typically 3:2)
        case 'push':
            return betAmount; // Return original bet
        case 'loss':
            return 0; // Lose bet
        case 'surrender':
            return betAmount / 2; // Return half the bet
        case 'pending':
            return betAmount; // Bet not resolved yet
        case 'insurance':
            return betAmount * 3; // Original bet + 2:1 insurance payout
        default:
            return 0;
    }
};

/**
 * Apply a player action to a hand
 */
export const applyPlayerAction = (
    gameState: GameState,
    playerId: string,
    handId: string,
    action: HandAction,
    options?: {
        amount?: number;
        card?: Card;
    }
): GameState => {
    // Clone the game state to avoid mutations
    const newState = { ...gameState };

    // Log this action
    const gameAction: GameAction = {
        type: action,
        playerId,
        handId,
        amount: options?.amount,
        card: options?.card,
        timestamp: new Date()
    };

    // Add the action to game history
    newState.history = [...newState.history, {
        id: uuidv4(),
        actions: [gameAction],
        roundNumber: newState.roundNumber,
        playerHands: [],
        dealerHand: newState.dealer.hand,
        bets: [],
        results: {},
        startTime: new Date(),
        originalDecks: [],
        shuffledDuringRound: false
    }];

    // Different handling based on action type
    switch (action) {
        case 'hit':
            // Logic for hit action
            break;
        case 'stand':
            // Logic for stand action
            break;
        case 'double':
            // Logic for double action
            break;
        case 'split':
            // Logic for split action
            break;
        case 'surrender':
            // Logic for surrender action
            break;
        case 'insurance':
            // Logic for insurance action
            break;
    }

    return newState;
};

/**
 * Check if all player hands are completed
 */
export const areAllHandsCompleted = (gameState: GameState): boolean => {
    for (const player of gameState.players) {
        for (const hand of player.hands) {
            if (hand.status === LocalHandStatus.ACTIVE) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Advance to the next active hand
 */
export const advanceToNextHand = (gameState: GameState): GameState => {
    const { players, activePlayerIndex, activeHandIndex } = gameState;
    const newState = { ...gameState };

    // If no active player, return unchanged
    if (activePlayerIndex === -1) {
        return newState;
    }

    // Try to find next active hand for current player
    const nextHandIndex = findNextActiveHandForCurrentPlayer(players, activePlayerIndex, activeHandIndex);
    if (nextHandIndex !== -1) {
        newState.activeHandIndex = nextHandIndex;
        return newState;
    }

    // Try to find next player with active hand
    const { nextPlayerIndex, firstActiveHandIndex } = findNextPlayerWithActiveHand(players, activePlayerIndex);
    if (nextPlayerIndex !== -1) {
        newState.activePlayerIndex = nextPlayerIndex;
        newState.activeHandIndex = firstActiveHandIndex;
        return newState;
    }

    // If no more active hands found, set indices to -1
    newState.activePlayerIndex = -1;
    newState.activeHandIndex = -1;

    // If all hands are completed, advance to dealer phase
    if (areAllHandsCompleted(newState)) {
        newState.currentPhase = LocalGamePhase.DEALER_TURN;
    }

    return newState;
};

// Helper function to find next active hand for current player
const findNextActiveHandForCurrentPlayer = (
    players: GameState['players'],
    activePlayerIndex: number,
    activeHandIndex: number
): number => {
    const activePlayer = players[activePlayerIndex];

    if (!activePlayer || activeHandIndex >= activePlayer.hands.length - 1) {
        return -1;
    }

    for (let i = activeHandIndex + 1; i < activePlayer.hands.length; i++) {
        if (activePlayer.hands[i]?.status === LocalHandStatus.ACTIVE) {
            return i;
        }
    }

    return -1;
};

// Helper function to find next player with active hand
const findNextPlayerWithActiveHand = (
    players: GameState['players'],
    activePlayerIndex: number
): { nextPlayerIndex: number; firstActiveHandIndex: number } => {
    for (let i = activePlayerIndex + 1; i < players.length; i++) {
        const nextPlayer = players[i];

        if (!nextPlayer) continue;

        for (let j = 0; j < nextPlayer.hands.length; j++) {
            if (nextPlayer.hands[j]?.status === LocalHandStatus.ACTIVE) {
                return { nextPlayerIndex: i, firstActiveHandIndex: j };
            }
        }
    }

    return { nextPlayerIndex: -1, firstActiveHandIndex: -1 };
};

/**
 * Game Engine class with core game logic
 */
export class GameEngine {
    private gameState: GameState;

    constructor(options: GameOptions) {
        this.gameState = createInitialGameState(options);
    }

    /**
     * Get the current game state
     */
    getGameState(): GameState {
        return this.gameState;
    }

    /**
     * Initialize a new game
     */
    initializeGame(options: GameOptions): void {
        this.gameState = createInitialGameState(options);
    }

    /**
     * Add a player to the game
     */
    addPlayer(name: string, balance: number): string {
        const playerId = uuidv4();

        this.gameState.players.push({
            id: playerId,
            name,
            balance,
            hands: [],
            currentBet: 0,
            totalBet: 0,
            winnings: 0,
            position: this.gameState.players.length,
            isActive: false
        });

        return playerId;
    }

    /**
     * Place a bet for a player
     */
    placeBet(playerId: string, amount: number): void {
        const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            throw new Error(`Player with ID ${playerId} not found`);
        }

        const player = this.gameState.players[playerIndex];

        if (player && amount > player.balance) {
            throw new Error('Insufficient balance');
        }

        if (player) {
            // Create a Bet object
            const bet: Bet = {
                id: uuidv4(),
                amount,
                timestamp: new Date(),
                status: 'active',
                handId: uuidv4()
            };

            // Update player's bet and balance
            this.gameState.players[playerIndex] = {
                ...player,
                currentBet: amount,
                totalBet: amount,
                balance: player.balance - amount,
                // We need to store bets elsewhere since Player doesn't have a bets property
                // This is temporary until Player interface is updated
            };

            // Store the bet in game state history
            this.gameState.history.push({
                id: uuidv4(),
                roundNumber: this.gameState.roundNumber,
                playerHands: [],
                dealerHand: this.gameState.dealer.hand,
                bets: [bet],
                results: {},
                startTime: new Date(),
                actions: [{
                    type: 'bet',
                    playerId,
                    amount,
                    timestamp: new Date()
                }],
                originalDecks: [],
                shuffledDuringRound: false
            });
        }
    }

    /**
     * Deal initial cards to all players and dealer
     */
    dealInitialCards(): void {
        // Implementation would deal 2 cards to each player and dealer
        // For now, this is a placeholder
        this.gameState.currentPhase = LocalGamePhase.PLAYER_TURN;
    }

    /**
     * Handle player action
     */
    handlePlayerAction(playerId: string, handId: string, action: HandAction, amount?: number): void {
        // Implementation would process different actions
        // For now, this is a placeholder
        this.gameState = applyPlayerAction(this.gameState, playerId, handId, action, { amount });
    }

    /**
     * Play dealer's turn
     */
    playDealerTurn(): void {
        // Implementation would handle dealer's play according to rules
        // For now, this is a placeholder
        this.gameState.currentPhase = LocalGamePhase.SETTLEMENT;
    }

    /**
     * Settle the round and calculate results
     */
    settleRound(): void {
        // Implementation would compare hands and calculate payouts
        // For now, this is a placeholder
        this.gameState.currentPhase = LocalGamePhase.CLEANUP;
    }

    /**
     * Reset for the next round
     */
    nextRound(): void {
        // Implementation would reset hands and prepare for next round
        // For now, this is a placeholder
        this.gameState.roundNumber++;
        this.gameState.currentPhase = LocalGamePhase.BETTING;
    }

    /**
     * End the current game
     */
    endGame(): void {
        this.gameState.status = LocalGameStatus.COMPLETED;
    }
}

// Type re-exports
export type { HandStatus };

export default GameEngine;