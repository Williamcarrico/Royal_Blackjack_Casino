/**
 * Hook for managing Blackjack hands
 */
import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import createHandSlice from '../../store/slices/handSlice';
import {
    Hand,
    DealerHand,
    HandAction,
    HandResult
} from '../../types/handTypes';
import { Card } from '../../types/cardTypes';
import {
    calculateValues,
    determineBestValue,
    isBlackjack,
    isBusted,
    isSoft,
    isPair,
    getAvailableActions,
    getBasicStrategyAction,
    calculateBustProbability
} from '../../domains/hands/handCalculator';
import { GameOptions } from '../../types/gameTypes';

// Hand slice store
const useHandStore = create(createHandSlice);

/**
 * Hook for managing Blackjack hands
 */
export function useHand(gameOptions?: GameOptions) {
    const {
        playerHands,
        dealerHand,
        createHand: createPlayerHand,
        addCardToDealerHand: createDealerHand,
        addCardToHand,
        evaluateHand: setHandStatus,
        getAvailableActions: setHandResult,
        updateHand,
        splitHand,
        clearHands,
        removeHand
    } = useHandStore();

    /**
     */
    const updateDealerHandStatus = useCallback(() => {
        if (!dealerHand) return;

        const values = calculateValues(dealerHand.cards);
        const bestValue = determineBestValue(values);

        if (bestValue > 21) {
            updateHand('dealer', {
                ...dealerHand,
                status: 'busted'
            });
        } else if (dealerHand.cards.length === 2 && bestValue === 21) {
            updateHand('dealer', {
                ...dealerHand,
                status: 'blackjack'
            });
        }
    }, [dealerHand, updateHand]);

    /**
     */
    const dealCard = useCallback((
        handId: string,
        card: Card,
        isPlayerHand: boolean = true
    ): void => {
        addCardToHand(handId, card);

        if (!isPlayerHand) {
            updateDealerHandStatus();
            return;
        }

        // Auto-evaluate player hand status
        const hand = playerHands.find(h => h.id === handId);
        if (!hand) return;

        // Check for bust
        if (isBusted(hand)) {
            setHandStatus(handId);
            setHandResult(handId);
        }

        // Check for blackjack on initial deal
        if (hand.cards.length === 2 && isBlackjack(hand)) {
            setHandStatus(handId);
        }
    }, [playerHands, addCardToHand, setHandStatus, setHandResult, updateDealerHandStatus]);

    /**
     * Initialize a new player hand
     */
    const initializeHand = useCallback((
        playerId: string,
        betId: string
    ): Hand => {
        const betAmount = parseInt(betId, 10) || 0;
        return createPlayerHand(playerId, betAmount);
    }, [createPlayerHand]);

    /**
     * Initialize the dealer hand
     */
    const initializeDealerHand = useCallback((): DealerHand => {
        const placeholderCard: Card = {
            id: 'placeholder',
            suit: 'hearts',
            rank: 'A',
            value: [1, 11],
            face: 'down'
        };
        createDealerHand(placeholderCard);

        const newDealerHand: DealerHand = {
            id: 'dealer',
            cards: [],
            values: [0],
            bestValue: 0,
            status: 'active',
            hasHiddenCard: false
        };
        return newDealerHand;
    }, [createDealerHand]);

    /**
     * Perform a hit action on a hand
     */
    const performHit = useCallback((
        handId: string,
        card: Card
    ): void => {
        dealCard(handId, card);
    }, [dealCard]);

    /**
     * Perform a stand action on a hand
     */
    const performStand = useCallback((
        handId: string
    ): void => {
        setHandStatus(handId);
        const hand = playerHands.find(h => h.id === handId);
        if (hand) {
            updateHand({ type: 'player', id: handId }, {
                ...hand,
                status: 'standing'
            });
        }
    }, [setHandStatus, playerHands, updateHand]);

    /**
     * Perform a double down action on a hand
     */
    const performDoubleDown = useCallback((
        handId: string,
        card: Card
    ): void => {
        // Add the card to the hand
        dealCard(handId, card);

        // Update hand status for double down
        const hand = playerHands.find(h => h.id === handId);

        if (hand) {
            // After doubling, player automatically stands
            // Unless they busted, which is handled in dealCard
            if (!isBusted(hand)) {
                setHandStatus(handId);
                updateHand({ type: 'player', id: handId }, {
                    ...hand,
                    status: 'standing',
                    isDoubled: true
                });
            }
        }
    }, [dealCard, playerHands, setHandStatus, updateHand]);

    /**
     * Perform a split action on a hand
     */
    const performSplit = useCallback((
        handId: string,
        newBetId: string,
        firstCard: Card,
        secondCard: Card
    ): Hand | null => {
        const hand = playerHands.find(h => h.id === handId);

        if (!hand || hand.cards.length !== 2 || !isPair(hand)) {
            return null;
        }

        // Split the hand
        const splitResult = splitHand(handId);

        if (splitResult) {
            // Get the two hands from the split result
            const [originalHand, newHand] = splitResult;

            // Deal a new card to each hand
            dealCard(originalHand.id, firstCard);
            dealCard(newHand.id, secondCard);

            // Special handling for split aces
            if (hand?.cards[0]?.rank === 'A') {
                // Most casinos only allow one card after splitting aces
                setHandStatus(originalHand.id);
                setHandStatus(newHand.id);

                updateHand({ type: 'player', id: originalHand.id }, {
                    ...originalHand,
                    status: 'standing'
                });

                updateHand({ type: 'player', id: newHand.id }, {
                    ...newHand,
                    status: 'standing'
                });
            }

            // Return just the new hand
            return newHand;
        }

        return null;
    }, [playerHands, splitHand, dealCard, setHandStatus, updateHand]);

    /**
     * Perform a surrender action on a hand
     */
    const performSurrender = useCallback((
        handId: string
    ): void => {
        setHandStatus(handId);
        setHandResult(handId);

        const hand = playerHands.find(h => h.id === handId);
        if (hand) {
            updateHand({ type: 'player', id: handId }, {
                ...hand,
                status: 'surrender',
                result: 'surrender'
            });
        }
    }, [setHandStatus, setHandResult, playerHands, updateHand]);

    /**
     * Perform an insurance action on a hand
     */
    const performInsurance = useCallback((
        handId: string,
        insuranceBetId: string
    ): void => {
        const hand = playerHands.find(h => h.id === handId);

        if (hand) {
            updateHand({ type: 'player', id: handId }, {
                ...hand,
                insuranceBet: parseInt(insuranceBetId, 10) || 0
            });
        }
    }, [playerHands, updateHand]);

    /**
     * Check if an action is available for a hand
     */
    const isActionAvailable = useCallback((
        handId: string,
        action: HandAction
    ): boolean => {
        const hand = playerHands.find(h => h.id === handId);

        if (!hand) {
            return false;
        }

        if (!dealerHand) {
            return false;
        }

        const dealerUpCard = dealerHand.cards[0];
        const availableActions = getAvailableActions(hand, dealerUpCard, gameOptions);

        return availableActions.includes(action);
    }, [playerHands, dealerHand, gameOptions]);

    /**
     * Get the best strategy action for a hand
     */
    const getBestAction = useCallback((
        handId: string
    ): HandAction | null => {
        const hand = playerHands.find(h => h.id === handId);

        if (!hand || hand.status !== 'active') {
            return null;
        }

        if (!dealerHand) {
            return null;
        }

        const dealerUpCard = dealerHand.cards[0];

        if (!dealerUpCard) {
            return null;
        }

        return getBasicStrategyAction(hand, dealerUpCard, gameOptions);
    }, [playerHands, dealerHand, gameOptions]);

    /**
     * Get the probability of busting with one more card
     */
    const getBustProbability = useCallback((
        handId: string,
        remainingCards: Card[]
    ): number => {
        const hand = playerHands.find(h => h.id === handId);

        if (!hand) {
            return 0;
        }

        return calculateBustProbability(hand, remainingCards);
    }, [playerHands]);

    /**
     * Evaluate hand values
     */
    const getHandValues = useCallback((
        handId: string,
        isDealer: boolean = false
    ): number[] => {
        const hand = isDealer
            ? dealerHand
            : playerHands.find(h => h.id === handId);

        if (!hand) {
            return [];
        }

        return calculateValues(hand.cards);
    }, [playerHands, dealerHand]);

    /**
     * Get the best value for a hand
     */
    const getBestHandValue = useCallback((
        handId: string,
        isDealer: boolean = false
    ): number => {
        const values = getHandValues(handId, isDealer);
        return determineBestValue(values);
    }, [getHandValues]);

    /**
     * Check if a hand is soft (contains an Ace counted as 11)
     */
    const getIsSoftHand = useCallback((
        handId: string,
        isDealer: boolean = false
    ): boolean => {
        const hand = isDealer
            ? dealerHand
            : playerHands.find(h => h.id === handId);

        if (!hand) {
            return false;
        }

        return isSoft(hand as Hand);
    }, [playerHands, dealerHand]);

    /**
     * Set the final result for a hand
     */
    const resolveHand = useCallback((
        handId: string,
        result: HandResult
    ): void => {
        setHandResult(handId);

        const hand = playerHands.find(h => h.id === handId);
        if (hand) {
            updateHand({ type: 'player', id: handId }, {
                ...hand,
                result
            });
        }
    }, [setHandResult, playerHands, updateHand]);

    /**
     * Get all active player hands
     */
    const getActiveHands = useMemo(() => {
        return playerHands.filter(hand => hand.status === 'active');
    }, [playerHands]);

    /**
     * Get all completed player hands
     */
    const getCompletedHands = useMemo(() => {
        return playerHands.filter(hand =>
            hand.status !== 'active' &&
            !['active', 'pending'].includes(hand.status)
        );
    }, [playerHands]);

    /**
     * Reset all hands for a new round
     */
    const resetHands = useCallback((): void => {
        clearHands();
    }, [clearHands]);

    return {
        // State
        playerHands,
        dealerHand,
        activeHands: getActiveHands,
        completedHands: getCompletedHands,

        // Hand creation
        initializeHand,
        initializeDealerHand,

        // Hand actions
        dealCard,
        performHit,
        performStand,
        performDoubleDown,
        performSplit,
        performSurrender,
        performInsurance,

        // Hand evaluation
        isActionAvailable,
        getBestAction,
        getBustProbability,
        getHandValues,
        getBestHandValue,
        getIsSoftHand,
        resolveHand,

        // Hand management
        resetHands,
        removeHand
    };
}

export default useHand;