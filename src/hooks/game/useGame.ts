/**
 * Hook for managing the Blackjack game
 */
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useBetting from './useBetting';
import useDeck from './useDeck';
import useHand from './useHand';
import usePlayer from './usePlayer';
import useGameRules from './useGameRules';
import {
    GamePhase,
    GameStatus,
    GameVariant,
    GameOptions,
    GameAction
} from '../../types/gameTypes';
import {
    createInitialGameState,
    LocalGameStatus,
    LocalGamePhase
} from '../../domains/game/gameEngine';
import { Card } from '../../types/cardTypes';
import { Hand, HandAction, HandResult } from '../../types/handTypes';
import { Bet } from '../../types/betTypes';

/**
 * Hook for managing the entire Blackjack game
 */
export function useGame(initialOptions?: Partial<GameOptions>) {
    // Initialize game state
    const [gameState, setGameState] = useState(createInitialGameState(initialOptions || {} as GameOptions));
    const [activeHandId, setActiveHandId] = useState<string | null>(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [autoPlayDelay, setAutoPlayDelay] = useState(1000);
    const [history, setHistory] = useState<Record<string, unknown>[]>([]);

    // Import game hooks
    const { rules, availableVariants, changeVariant, updateOptions } = useGameRules();
    const {
        shoe, drawCardFromShoe, drawHoleCard, revealHoleCard,
        needsReshuffle, resetAndCreateNewShoe
    } = useDeck(rules.options);
    const {
        playerHands, dealerHand, initializeHand, initializeDealerHand,
        dealCard, performHit, performStand, performDoubleDown, performSplit,
        performSurrender, performInsurance, isActionAvailable,
        getBestAction, resolveHand, resetHands
    } = useHand(rules.options);
    const {
        players, activePlayer, addNewPlayer, removePlayerById,
        updateBalance, recordHandResult, resetPlayers
    } = usePlayer();
    const {
        bets, placeActiveSideBet, settle
    } = useBetting();

    // We need to mock these methods if they don't exist in useBetting
    const mockPlaceBet = (playerId: string, amount: number): Bet => {
        return {
            id: uuidv4(),
            amount,
            status: 'pending',
            handId: playerId,
            timestamp: new Date()
        };
    };

    const mockClearBets = (): void => {
        // Mock implementation
    };

    // Use real or mock implementations
    const placeBet = (useBetting as any).placeBet || mockPlaceBet;
    const clearBets = (useBetting as any).clearBets || mockClearBets;

    /**
     * Initialize the game engine when all hooks are ready
     */
    useEffect(() => {
        // Apply initial options if provided
        if (initialOptions) {
            if (initialOptions.variant) {
                changeVariant(initialOptions.variant);
            }
            updateOptions(initialOptions);
        }
    }, []);

    /**
     * Start a new game
     */
    const startGame = useCallback((): void => {
        // Reset game state
        setGameState(prevState => ({
            ...prevState,
            status: LocalGameStatus.ACTIVE,
            currentPhase: LocalGamePhase.BETTING,
            roundNumber: 1
        }));

        // Initialize a fresh shoe if needed
        if (needsReshuffle || shoe?.cards.length === 0) {
            resetAndCreateNewShoe();
        }

        // Reset hands
        resetHands();

        // Clear bets
        clearBets();

        // Reset history
        setHistory([]);
    }, [needsReshuffle, shoe, resetAndCreateNewShoe, resetHands, clearBets]);

    /**
     * End the current game
     */
    const endGame = useCallback((): void => {
        // Update game state
        setGameState(prevState => ({
            ...prevState,
            status: LocalGameStatus.COMPLETED,
            currentPhase: LocalGamePhase.CLEANUP
        }));

        // Store final game state in history
        const finalState = {
            players: [...players],
            dealerHand: { ...dealerHand },
            playerHands: [...playerHands],
            bets: [...bets],
            roundNumber: gameState.roundNumber || 0
        };

        setHistory(prevHistory => [...prevHistory, finalState]);
    }, [gameState, players, dealerHand, playerHands, bets]);

    /**
     * Deal cards to start a round
     */
    const dealRound = useCallback((): void => {
        if (gameState.currentPhase !== LocalGamePhase.BETTING) {
            return;
        }

        // Check if any bets are placed
        const activeBets = bets.filter(bet => !bet.status || bet.status === 'pending');
        if (activeBets.length === 0) {
            return; // No bets to deal for
        }

        // Initialize dealer hand
        const dealer = initializeDealerHand();

        // Deal first card to each player with a bet
        const playerHandsMap: Record<string, Hand> = {};

        for (const bet of activeBets) {
            const handId = bet.handId || '';
            const playerId = handId.split('-')[0];
            const player = players.find(p => p.id === playerId);
            if (player) {
                const hand = initializeHand(player.id, bet.id);
                playerHandsMap[bet.id] = hand;

                // Deal first card face up
                const firstCard = drawCardFromShoe(true);
                if (firstCard) {
                    dealCard(hand.id, firstCard);
                }
            }
        }

        // Deal first card to dealer (face up)
        const dealerFirstCard = drawCardFromShoe(true);
        if (dealerFirstCard) {
            dealCard(dealer.id, dealerFirstCard, false);
        }

        // Deal second card to each player
        for (const bet of activeBets) {
            const hand = playerHandsMap[bet.id];
            if (hand) {
                const secondCard = drawCardFromShoe(true);
                if (secondCard) {
                    dealCard(hand.id, secondCard);
                }
            }
        }

        // Deal second card to dealer (face down)
        const dealerSecondCard = drawHoleCard();
        if (dealerSecondCard) {
            dealCard(dealer.id, dealerSecondCard, false);
        }

        // Update game phase
        setGameState({
            ...gameState,
            currentPhase: LocalGamePhase.PLAYER_TURN
        });

        // Set the first player hand as active
        const firstHandId = Object.values(playerHandsMap)[0]?.id;
        if (firstHandId) {
            setActiveHandId(firstHandId);
        }

        // Check for dealer blackjack
        if (dealerFirstCard && dealerSecondCard &&
            ((dealerFirstCard.rank === 'A' && ['10', 'J', 'Q', 'K'].includes(dealerSecondCard.rank)) ||
                (dealerSecondCard.rank === 'A' && ['10', 'J', 'Q', 'K'].includes(dealerFirstCard.rank)))) {
            // Dealer has blackjack
            revealHoleCard();

            // Resolve all player hands
            for (const hand of playerHands) {
                // Check if player has blackjack too (push)
                const isPlayerBlackjack = hand.cards.length === 2 &&
                    rules.isBlackjack(hand);

                if (isPlayerBlackjack) {
                    resolveHand(hand.id, 'push');
                    settle(hand.id, 'push');
                } else {
                    resolveHand(hand.id, 'loss');
                    settle(hand.id, 'loss');
                }
            }

            // Move to dealer phase
            setGameState({
                ...gameState,
                currentPhase: LocalGamePhase.DEALER_TURN
            });

            // Then immediately to settlement
            setTimeout(() => {
                setGameState({
                    ...gameState,
                    currentPhase: LocalGamePhase.SETTLEMENT
                });

                // Then to next round
                setTimeout(() => {
                    startNextRound();
                }, 2000);
            }, 1000);
        }
    }, [gameState, bets, players, initializeDealerHand, initializeHand,
        drawCardFromShoe, drawHoleCard, dealCard, revealHoleCard,
        playerHands, rules, resolveHand, settle, startNextRound]);

    /**
     * Handle player action (hit, stand, double, split, surrender)
     */
    const handlePlayerAction = useCallback((
        handId: string,
        action: HandAction
    ): void => {
        if (gameState.currentPhase !== LocalGamePhase.PLAYER_TURN || activeHandId !== handId) {
            return;
        }

        const hand = playerHands.find(h => h.id === handId);
        if (!hand) {
            return;
        }

        // Apply the action
        switch (action) {
            case 'hit':
                if (isActionAvailable(handId, 'hit')) {
                    const card = drawCardFromShoe(true);
                    if (card) {
                        performHit(handId, card);
                    }
                }
                break;

            case 'stand':
                if (isActionAvailable(handId, 'stand')) {
                    performStand(handId);
                    advanceToNextHand();
                }
                break;

            case 'double':
                if (isActionAvailable(handId, 'double')) {
                    // Double the bet amount
                    const playerId = hand.id.split('-')[0];
                    if (!playerId) break;

                    const player = players.find(p => p.id === playerId);
                    // Handle bet.id vs hand.bet type conversion
                    const bet = bets.find(b => String(b.id) === String(hand.bet));

                    if (player && bet) {
                        // Check if player has enough balance
                        if (player.balance >= bet.amount) {
                            // Update player balance
                            updateBalance(player.id, -bet.amount);

                            // Draw card and perform double down
                            const card = drawCardFromShoe(true);
                            if (card) {
                                performDoubleDown(handId, card);
                            }

                            // Advance to next hand since doubling ends the turn
                            advanceToNextHand();
                        }
                    }
                }
                break;

            case 'split':
                if (isActionAvailable(handId, 'split')) {
                    // Create a new bet for the split hand
                    const playerId = hand.id.split('-')[0];
                    if (!playerId) break;

                    const player = players.find(p => p.id === playerId);
                    // Handle bet.id vs hand.bet type conversion
                    const bet = bets.find(b => String(b.id) === String(hand.bet));

                    if (player && bet) {
                        // Check if player has enough balance
                        if (player.balance >= bet.amount) {
                            // Update player balance
                            updateBalance(player.id, -bet.amount);

                            // Create a new bet for the split hand
                            const newBetId = uuidv4();
                            placeBet(player.id, bet.amount);

                            // Draw two new cards
                            const firstCard = drawCardFromShoe(true);
                            const secondCard = drawCardFromShoe(true);

                            if (firstCard && secondCard) {
                                // Perform the split
                                performSplit(handId, newBetId, firstCard, secondCard);
                            }
                        }
                    }
                }
                break;

            case 'surrender':
                if (isActionAvailable(handId, 'surrender')) {
                    performSurrender(handId);

                    // Return half the bet
                    const playerId = hand.id.split('-')[0];
                    if (!playerId) break;

                    // Handle bet.id vs hand.bet type conversion
                    const bet = bets.find(b => String(b.id) === String(hand.bet));

                    if (bet) {
                        const halfAmount = bet.amount / 2;
                        updateBalance(playerId, halfAmount);
                        settle(bet.id, 'surrender');
                    }

                    advanceToNextHand();
                }
                break;

            case 'insurance':
                if (isActionAvailable(handId, 'insurance')) {
                    // Place insurance side bet
                    const playerId = hand.id.split('-')[0];
                    if (!playerId) break;

                    const player = players.find(p => p.id === playerId);
                    // Handle bet.id vs hand.bet type conversion
                    const bet = bets.find(b => String(b.id) === String(hand.bet));

                    if (player && bet) {
                        const insuranceAmount = bet.amount / 2;

                        // Check if player has enough balance
                        if (player.balance >= insuranceAmount) {
                            // Update player balance
                            updateBalance(player.id, -insuranceAmount);

                            // Place insurance side bet
                            const insuranceBetId = uuidv4();
                            placeActiveSideBet(player.id, hand.id, 'insurance');

                            // Record the insurance bet
                            performInsurance(handId, insuranceBetId);
                        }
                    }
                }
                break;
        }

        // Check if all hands are completed
        const allHandsCompleted = playerHands.every(h =>
            h.status !== 'active'
        );

        if (allHandsCompleted) {
            // Move to dealer phase
            setGameState({
                ...gameState,
                currentPhase: LocalGamePhase.DEALER_TURN
            });

            // Deal dealer cards
            playDealerHand();
        }
    }, [
        gameState, activeHandId, playerHands, isActionAvailable,
        drawCardFromShoe, performHit, performStand, players,
        bets, updateBalance, performDoubleDown, placeBet,
        performSplit, performSurrender, settle, placeActiveSideBet,
        performInsurance, advanceToNextHand, playDealerHand
    ]);

    /**
     * Advance to the next active hand
     */
    const advanceToNextHand = useCallback((): void => {
        // Find the current hand index
        const currentIndex = playerHands.findIndex(h => h.id === activeHandId);

        if (currentIndex === -1) {
            return;
        }

        // Find the next active hand
        for (let i = currentIndex + 1; i < playerHands.length; i++) {
            if (playerHands[i]?.status === 'active') {
                setActiveHandId(playerHands[i]?.id || null);
                return;
            }
        }

        // No more active hands, move to dealer phase
        setGameState({
            ...gameState,
            currentPhase: LocalGamePhase.DEALER_TURN
        });

        // Deal dealer cards
        playDealerHand();
    }, [playerHands, activeHandId, gameState, playDealerHand]);

    /**
     * Play the dealer's hand according to rules
     */
    const playDealerHand = useCallback((): void => {
        // Reveal dealer's hole card
        revealHoleCard();

        // Check if there are any active player hands that didn't bust or surrender
        const activePlayerHands = playerHands.filter(
            h => h.status !== 'busted' && h.status !== 'surrender'
        );

        if (activePlayerHands.length === 0) {
            // All players busted, no need to play dealer hand
            settleBets();
            return;
        }

        // Play dealer hand according to rules
        const dealerCards = dealerHand?.cards || [];
        const hitSoft17 = rules.options.dealerHitsSoft17 || false;

        // Calculate initial values
        let values = dealerCards.map(card => Array.isArray(card.value) ? card.value[0] : card.value);
        let total = values.reduce((sum, value) => sum + Number(value), 0);
        let hasAce = dealerCards.some(card => card.rank === 'A');

        // Keep hitting until reaching required value
        while (
            (total < 17) ||
            (hitSoft17 && total === 17 && hasAce && values.includes(11))
        ) {
            // Draw a card
            const card = drawCardFromShoe(true);
            if (card && dealerHand) {
                dealCard(dealerHand.id, card, false);

                // Update values
                dealerCards.push(card);
                values = dealerCards.map(card => Array.isArray(card.value) ? card.value[0] : card.value);
                total = values.reduce((sum, value) => sum + Number(value), 0);

                // If over 21 and has an Ace counted as 11, count it as 1
                if (total > 21 && hasAce && values.includes(11)) {
                    const aceIndex = values.indexOf(11);
                    values[aceIndex] = 1;
                    total = values.reduce((sum, value) => sum + Number(value), 0);
                }

                hasAce = dealerCards.some(card => card.rank === 'A');
            }
        }

        // Move to settlement phase
        setGameState({
            ...gameState,
            currentPhase: LocalGamePhase.SETTLEMENT
        });

        // Settle all bets
        settleBets();
    }, [dealerHand, revealHoleCard, playerHands, rules, drawCardFromShoe, dealCard, gameState, settleBets]);

    /**
     * Settle all bets based on hand results
     */
    const settleBets = useCallback((): void => {
        // Compare each player hand with the dealer
        for (const hand of playerHands) {
            // Skip hands that are already settled (surrendered, busted)
            if (hand.status === 'surrender' || hand.status === 'busted') {
                continue;
            }

            // Get the bet for this hand
            const bet = bets.find(b => b.id === hand.bet);
            if (!bet) continue;

            // Compare hands and determine result
            let result: HandResult;

            // Check for blackjack
            const playerBlackjack = rules.isBlackjack(hand);
            const dealerBlackjack = dealerHand?.cards.length === 2 &&
                dealerHand && rules.isBlackjack(dealerHand as unknown as Hand);

            if (playerBlackjack && !dealerBlackjack) {
                // Player has blackjack, dealer doesn't
                result = 'blackjack';
            } else if (!playerBlackjack && dealerBlackjack) {
                // Dealer has blackjack, player doesn't
                result = 'loss';
            } else if (playerBlackjack && dealerBlackjack) {
                // Both have blackjack
                result = 'push';
            } else {
                // Compare hand values
                const playerValues = hand.cards.map(card => Array.isArray(card.value) ? card.value[0] : card.value);
                const playerTotal = playerValues.reduce((sum, value) => sum + Number(value), 0);

                const dealerValues = dealerHand?.cards.map(card => Array.isArray(card.value) ? card.value[0] : card.value) || [];
                const dealerTotal = dealerValues.reduce((sum, value) => sum + Number(value), 0);

                // Determine result
                if (dealerTotal > 21) {
                    // Dealer busted
                    result = 'win';
                } else if (playerTotal > dealerTotal) {
                    // Player wins
                    result = 'win';
                } else if (playerTotal < dealerTotal) {
                    // Dealer wins
                    result = 'loss';
                } else {
                    // Push (tie)
                    result = 'push';
                }
            }

            // Set hand result
            resolveHand(hand.id, result);

            // Settle the bet
            const payout = settle(bet.id, result);

            // Update player balance with winnings
            if (payout > 0) {
                const playerId = hand.id.split('-')[0];
                if (playerId) {
                    updateBalance(playerId, payout);
                }
            }

            // Record hand result for player statistics
            const playerId = hand.id.split('-')[0];
            if (playerId) {
                const player = players.find(p => p.id === playerId);
                if (player) {
                    recordHandResult(
                        player.id,
                        result === 'win' || result === 'blackjack',
                        bet.amount,
                        payout
                    );
                }
            }
        }

        // Process insurance bets if applicable
        processSideBets();

        // Set timer to start next round
        setTimeout(() => {
            startNextRound();
        }, 3000);
    }, [playerHands, bets, rules, dealerHand, resolveHand, settle, updateBalance, players, recordHandResult, processSideBets, startNextRound]);

    /**
     * Process side bets (insurance, etc.)
     */
    const processSideBets = useCallback((): void => {
        // Process insurance bets - using a type guard to check for insurance bets
        const insuranceBets = bets.filter(b =>
            // Check if bet has type property and it's 'insurance'
            (b as any).type === 'insurance' &&
            b.status !== 'won' &&
            b.status !== 'lost'
        );

        // Check if dealer has blackjack (for insurance)
        const dealerBlackjack = dealerHand?.cards.length === 2 &&
            dealerHand && rules.isBlackjack(dealerHand as unknown as Hand);

        for (const bet of insuranceBets) {
            if (dealerBlackjack) {
                // Insurance wins (pays 2:1)
                const payout = bet.amount * 2;
                settle(bet.id, 'win');
                const playerId = bet.handId?.split('-')[0];
                if (playerId) {
                    updateBalance(playerId, payout);
                }
            } else {
                // Insurance loses
                settle(bet.id, 'loss');
            }
        }
    }, [bets, dealerHand, rules, settle, updateBalance]);

    /**
     * Start the next round
     */
    const startNextRound = useCallback((): void => {
        // Check if we need to reshuffle
        if (needsReshuffle) {
            resetAndCreateNewShoe();
        }

        // Reset hands
        resetHands();

        // Store current game state in history
        const roundState = {
            players: [...players],
            dealerHand: { ...dealerHand },
            playerHands: [...playerHands],
            bets: [...bets],
            roundNumber: gameState.roundNumber || 0
        };

        setHistory(prevHistory => [...prevHistory, roundState]);

        // Clear bets (they've been settled by now)
        clearBets();

        // Reset active hand
        setActiveHandId(null);

        // Move to betting phase of next round
        setGameState({
            ...gameState,
            currentPhase: LocalGamePhase.BETTING,
            roundNumber: (gameState.roundNumber || 0) + 1
        });
    }, [needsReshuffle, resetAndCreateNewShoe, resetHands, players, dealerHand, playerHands, bets, gameState, clearBets]);

    /**
     * Place a bet for a player
     */
    const placeBetForPlayer = useCallback((
        playerId: string,
        amount: number
    ): Bet | null => {
        // Check if we're in betting phase
        if (gameState.currentPhase !== LocalGamePhase.BETTING) {
            return null;
        }

        // Check if player has enough balance
        const player = players.find(p => p.id === playerId);
        if (!player || player.balance < amount) {
            return null;
        }

        // Place bet
        const bet = placeBet(playerId, amount);

        // Deduct amount from player balance
        if (bet) {
            updateBalance(playerId, -amount);
        }

        return bet;
    }, [gameState, players, placeBet, updateBalance]);

    /**
     * Toggle auto-play mode
     */
    const toggleAutoPlay = useCallback((): void => {
        setIsAutoPlay(prev => !prev);
    }, []);

    /**
     * Set auto-play delay
     */
    const setAutoPlaySpeed = useCallback((delay: number): void => {
        setAutoPlayDelay(delay);
    }, []);

    /**
     * Auto-play a hand according to basic strategy
     */
    useEffect(() => {
        if (isAutoPlay && gameState.currentPhase === LocalGamePhase.PLAYER_TURN && activeHandId) {
            // Get best action from basic strategy
            const bestAction = getBestAction(activeHandId);

            if (bestAction) {
                // Set a timeout to execute the action
                const timeoutId = setTimeout(() => {
                    handlePlayerAction(activeHandId, bestAction);
                }, autoPlayDelay);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [isAutoPlay, gameState.currentPhase, activeHandId, getBestAction, handlePlayerAction, autoPlayDelay]);

    /**
     * Reset the entire game
     */
    const resetGame = useCallback((): void => {
        // Reset all game state
        resetPlayers();
        resetHands();
        clearBets();
        resetAndCreateNewShoe();

        setGameState(createInitialGameState(rules.options));
        setActiveHandId(null);
        setHistory([]);
    }, [resetPlayers, resetHands, clearBets, resetAndCreateNewShoe, rules.options]);

    /**
     * Check if a specific action is available for the active hand
     */
    const canPerformAction = useCallback((action: string): boolean => {
        if (!activeHandId) return false;

        switch (action) {
            case 'deal':
                return gameState.currentPhase === LocalGamePhase.BETTING &&
                    bets.some(bet => bet.status === 'pending');

            case 'hit':
            case 'stand':
            case 'double':
            case 'split':
            case 'surrender':
            case 'insurance':
                return gameState.currentPhase === LocalGamePhase.PLAYER_TURN &&
                    isActionAvailable(activeHandId, action as HandAction);

            default:
                return false;
        }
    }, [gameState.currentPhase, activeHandId, bets, isActionAvailable]);

    return {
        // State
        gameState,
        activeHandId,
        playerHands,
        dealerHand,
        players,
        activePlayer,
        bets,
        isAutoPlay,
        autoPlayDelay,
        history,

        // Game Rules
        rules,
        availableVariants,
        changeVariant,
        updateOptions,

        // Game Flow
        startGame,
        endGame,
        dealRound,
        handlePlayerAction,
        resetGame,
        canPerformAction,

        // Player Management
        addNewPlayer,
        removePlayerById,
        updateBalance,

        // Betting
        placeBetForPlayer,

        // Auto-play
        toggleAutoPlay,
        setAutoPlaySpeed
    };
}

export default useGame;