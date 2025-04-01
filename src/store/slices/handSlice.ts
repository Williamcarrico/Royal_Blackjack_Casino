/**
 * Hand slice for the blackjack game store
 */
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { HandSlice, HandId } from '../../types/storeTypes';
import { Hand, DealerHand, HandAction } from '../../types/handTypes';
import { Card } from '../../types/cardTypes';

/**
 * Calculate all possible values for a hand (accounting for Aces)
 */
const calculateHandValues = (cards: Card[]): number[] => {
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
                if (lowValue !== undefined) {
                    newValues.push(value + lowValue);  // Add low value
                }
                if (highValue !== undefined) {
                    newValues.push(value + highValue); // Add high value
                }
            });

            // Remove duplicates and update values
            // Use Array.from instead of spread operator to avoid Set iteration issues
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
const determineBestValue = (values: number[]): number => {
    // Filter values that don't exceed 21
    const validValues = values.filter(v => v <= 21);

    // Return the highest valid value, or the lowest value if all are busts
    return validValues.length > 0
        ? Math.max(...validValues)
        : Math.min(...values);
};

// Export utility functions for use in other components
export const handUtils = {
    /**
     * Check if a hand is a blackjack (21 with exactly 2 cards)
     */
    isBlackjack: (hand: Hand): boolean => {
        return hand.cards.length === 2 && hand.bestValue === 21;
    },

    /**
     * Check if a hand is busted (value exceeds 21)
     */
    isBusted: (hand: Hand): boolean => {
        return hand.bestValue > 21;
    },

    /**
     * Check if a hand is soft (contains an Ace counted as 11)
     */
    isSoft: (hand: Hand): boolean => {
        // Calculate value treating all Aces as 1
        const hardValue = hand.cards.reduce((sum, card) => {
            if (Array.isArray(card.value) && card.value[0] !== undefined) {
                return sum + card.value[0]; // Add low value for Aces
            }
            return sum + (typeof card.value === 'number' ? card.value : 0);
        }, 0);

        // If best value is higher than hard value, hand must be soft
        return hand.bestValue > hardValue;
    }
};

/**
 * Check if a hand has a pair (first two cards have same rank)
 */
const isPair = (hand: Hand): boolean => {
    return hand.cards.length === 2 &&
        hand.cards[0]?.rank === hand.cards[1]?.rank;
};

/**
 * Get available actions for a hand based on its current state
 */
const getAvailableActions = (hand: Hand, dealerUpCard?: Card): HandAction[] => {
    const actions: HandAction[] = [];

    // If hand is not active, no actions are available
    if (hand.status !== 'active') {
        return actions;
    }

    // Hit and stand are always available for active hands
    actions.push('hit', 'stand');

    // Double is available on first two cards
    if (hand.cards.length === 2 && !hand.isDoubled && !hand.isSplit) {
        actions.push('double');
    }

    // Split is available for pairs
    if (isPair(hand) && !hand.isSplit) {
        actions.push('split');
    }

    // Surrender is available on first two cards
    if (hand.cards.length === 2) {
        actions.push('surrender');
    }

    // Insurance is available when dealer shows an Ace
    if (dealerUpCard && dealerUpCard.rank === 'A' && hand.cards.length === 2) {
        actions.push('insurance');
    }

    return actions;
};

/**
 * Creates the hand slice
 */
const createHandSlice: StateCreator<HandSlice> = (set, get) => ({
    playerHands: [],
    dealerHand: null,
    activeHandIndex: -1,

    createHand: (playerId, bet) => {
        const hand: Hand = {
            id: uuidv4(),
            cards: [],
            values: [0],
            bestValue: 0,
            status: 'active',
            actions: [],
            bet,
            isDoubled: false,
            isSplit: false
        };

        // Add this new hand to playerHands
        set(state => ({
            playerHands: [...state.playerHands, hand]
        }));

        return hand;
    },

    addCardToHand: (handId, card) => {
        set(state => {
            // Find the target hand by ID
            const handIndex = state.playerHands.findIndex(h => h.id === handId);

            if (handIndex === -1) {
                throw new Error(`Hand with ID ${handId} not found`);
            }

            const hand = state.playerHands[handIndex];
            if (!hand) {
                throw new Error(`Hand with index ${handIndex} is undefined`);
            }

            // Add card to the hand
            const updatedCards = [...hand.cards, card];

            // Recalculate hand values
            const values = calculateHandValues(updatedCards);
            const bestValue = determineBestValue(values);

            // Check if hand is busted
            const status = bestValue > 21 ? 'busted' : hand.status;

            // Create updated hand
            const updatedHand: Hand = {
                ...hand,
                cards: updatedCards,
                values,
                bestValue,
                status
            };

            // Get available actions (empty array if busted)
            updatedHand.actions = status === 'busted'
                ? []
                : getAvailableActions(updatedHand);

            // Update playerHands array
            const updatedHands = [...state.playerHands];
            updatedHands[handIndex] = updatedHand;

            return {
                playerHands: updatedHands
            };
        });
    },

    addCardToDealerHand: (card) => {
        set(state => {
            // If dealer hand doesn't exist, create it
            if (!state.dealerHand) {
                const newDealerHand: DealerHand = {
                    id: uuidv4(),
                    cards: [card],
                    values: calculateHandValues([card]),
                    bestValue: determineBestValue(calculateHandValues([card])),
                    status: 'active',
                    hasHiddenCard: card.face === 'down'
                };

                return {
                    dealerHand: newDealerHand
                };
            }

            // Add card to existing dealer hand
            const updatedCards = [...state.dealerHand.cards, card];
            const values = calculateHandValues(updatedCards);
            const bestValue = determineBestValue(values);

            // Check if dealer has busted
            const status = bestValue > 21 ? 'busted' : state.dealerHand.status;

            return {
                dealerHand: {
                    ...state.dealerHand,
                    cards: updatedCards,
                    values,
                    bestValue,
                    status,
                    hasHiddenCard: state.dealerHand.hasHiddenCard || card.face === 'down'
                }
            };
        });
    },

    splitHand: (handId) => {
        const { playerHands } = get();

        // Find the hand to split
        const handIndex = playerHands.findIndex(h => h.id === handId);

        if (handIndex === -1) {
            throw new Error(`Hand with ID ${handId} not found`);
        }

        const hand = playerHands[handIndex];
        if (!hand) {
            throw new Error(`Hand with index ${handIndex} is undefined`);
        }

        // Ensure the hand has exactly 2 cards and they form a pair
        if (hand.cards.length !== 2 || hand.cards[0]?.rank !== hand.cards[1]?.rank) {
            throw new Error('Hand cannot be split: not a pair');
        }

        // Extract the cards with proper typing
        const firstCard = hand.cards[0];
        const secondCard = hand.cards[1];

        if (!firstCard || !secondCard) {
            throw new Error('Hand cards are undefined');
        }

        // Create two new hands, each with one card from the original hand
        const firstHand: Hand = {
            id: uuidv4(),
            cards: [firstCard],
            values: calculateHandValues([firstCard]),
            bestValue: determineBestValue(calculateHandValues([firstCard])),
            status: 'active',
            actions: [],
            bet: hand.bet,
            isDoubled: false,
            isSplit: true,
            originalHand: hand.id
        };

        const secondHand: Hand = {
            id: uuidv4(),
            cards: [secondCard],
            values: calculateHandValues([secondCard]),
            bestValue: determineBestValue(calculateHandValues([secondCard])),
            status: 'active',
            actions: [],
            bet: hand.bet,
            isDoubled: false,
            isSplit: true,
            originalHand: hand.id
        };

        // Update available actions
        firstHand.actions = getAvailableActions(firstHand);
        secondHand.actions = getAvailableActions(secondHand);

        // Update player hands array, replacing the original hand with the two new ones
        const updatedHands = [
            ...playerHands.slice(0, handIndex),
            firstHand,
            secondHand,
            ...playerHands.slice(handIndex + 1)
        ];

        set({
            playerHands: updatedHands,
            activeHandIndex: handIndex // Set active hand to the first split hand
        });

        return [firstHand, secondHand];
    },

    evaluateHand: (handId) => {
        const { playerHands } = get();
        const hand = playerHands.find(h => h.id === handId);

        if (!hand) {
            throw new Error(`Hand with ID ${handId} not found`);
        }

        return hand.bestValue;
    },

    getAvailableActions: (handId) => {
        const { playerHands, dealerHand } = get();
        const hand = playerHands.find(h => h.id === handId);

        if (!hand) {
            throw new Error(`Hand with ID ${handId} not found`);
        }

        // Get dealer's up card (first card)
        const dealerUpCard = dealerHand?.cards[0];

        const actions = getAvailableActions(hand, dealerUpCard);
        return actions;
    },

    clearHands: () => {
        set({
            playerHands: [],
            dealerHand: null,
            activeHandIndex: -1
        });
    },

    // Add removeHand method to remove a hand by ID
    removeHand: (handId: string) => {
        set(state => ({
            playerHands: state.playerHands.filter(h => h.id !== handId)
        }));
    },

    updateHand: (handId: HandId, updatedHandData: Partial<Hand | DealerHand>) => {
        set(state => {
            if (handId === 'dealer') {
                if (!state.dealerHand) {
                    return state;
                }
                return {
                    ...state,
                    dealerHand: {
                        ...state.dealerHand,
                        ...updatedHandData
                    }
                };
            }

            const handIndex = state.playerHands.findIndex(h => h.id === handId.id);
            if (handIndex === -1) {
                return state;
            }

            const updatedHands = [...state.playerHands];
            const currentHand = updatedHands[handIndex];

            if (currentHand) {
                updatedHands[handIndex] = {
                    ...currentHand,
                    ...(updatedHandData as Partial<Hand>)
                };
            }

            return {
                ...state,
                playerHands: updatedHands
            };
        });
    }
});

export default createHandSlice;