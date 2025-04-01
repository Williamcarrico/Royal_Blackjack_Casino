/**
 * Dealer logic for handling dealer decision-making in Blackjack
 */
import { Card, CardFace } from '../../types/cardTypes';
import { DealerHand, HandAction } from '../../types/handTypes';
import { GameOptions } from '../../types/gameTypes';
import { calculateValues, determineBestValue } from '../hands/handCalculator';

/**
 * Determines if the dealer should hit or stand based on their current hand
 * @param hand The dealer's hand
 * @param options The game options (e.g., whether dealer hits on soft 17)
 * @returns boolean True if dealer should hit, false if dealer should stand
 */
export const shouldDealerHit = (hand: DealerHand, options?: GameOptions): boolean => {
    const hitSoft17 = options?.dealerHitsSoft17 ?? true;
    const handValues = calculateValues(hand.cards);
    const bestValue = determineBestValue(handValues);

    // Dealer stands on hard 17 or higher
    if (bestValue >= 17 && !(hitSoft17 && isSoft17(hand))) {
        return false;
    }

    // Dealer hits on 16 or lower, or soft 17 if the rule says so
    return true;
};

/**
 * Checks if the dealer's hand is a soft 17
 * @param hand The dealer's hand
 * @returns boolean True if hand is a soft 17
 */
export const isSoft17 = (hand: DealerHand): boolean => {
    // Must contain at least one Ace
    const hasAce = hand.cards.some(card => card.rank === 'A');
    if (!hasAce) return false;

    const handValues = calculateValues(hand.cards);

    // Check if there's a soft 17 (a hand value of 17 with an Ace counted as 11)
    return handValues.includes(17) && handValues.some(value => value < 17);
};

/**
 * Executes dealer's turn
 * @param hand The dealer's hand
 * @param remainingCards The cards remaining in the shoe
 * @param options Game options for dealer behavior
 * @returns The updated dealer hand after taking all actions
 */
export const playDealerHand = (
    hand: DealerHand,
    remainingCards: Card[],
    options?: GameOptions
): { hand: DealerHand, usedCards: Card[] } => {
    const updatedHand: DealerHand = { ...hand };
    const usedCards: Card[] = [];

    // Reveal hole card if it's face down
    if (updatedHand.cards.length >= 2 && updatedHand.cards[1]?.face === 'down') {
        updatedHand.cards[1] = { ...updatedHand.cards[1], face: 'up' as CardFace };
    }

    // Keep hitting until dealer should stand
    while (shouldDealerHit(updatedHand, options) && remainingCards.length > 0) {
        // Draw a card from remaining cards
        const drawnCard = remainingCards.shift();

        if (drawnCard) {
            // Add card to hand face up
            const newCard = { ...drawnCard, face: 'up' as CardFace };
            updatedHand.cards.push(newCard);
            usedCards.push(newCard);

            // Recalculate hand value
            const handValues = calculateValues(updatedHand.cards);
            updatedHand.values = handValues;
            updatedHand.bestValue = determineBestValue(handValues);

            // Check for bust
            if (updatedHand.bestValue > 21) {
                updatedHand.status = 'busted';
                break;
            }
        }
    }

    // Set final hand status
    if (updatedHand.status !== 'busted') {
        if (updatedHand.cards.length === 2 && updatedHand.bestValue === 21) {
            updatedHand.status = 'blackjack';
        } else {
            updatedHand.status = 'standing';
        }
    }

    return { hand: updatedHand, usedCards };
};

/**
 * Calculates the probability of the dealer busting
 * @param upCard The dealer's face-up card
 * @param hitSoft17 Whether the dealer hits on soft 17
 * @returns Probability of dealer busting (0-1)
 */
export const calculateDealerBustProbability = (
    upCard: Card,
    hitSoft17: boolean = true
): number => {
    // Bust probabilities based on dealer's up card (estimated values)
    // These are approximated values for a 6-deck game
    const bustProbabilities: Record<string, number> = {
        '2': 0.35,
        '3': 0.37,
        '4': 0.40,
        '5': 0.42,
        '6': 0.44,
        '7': 0.26,
        '8': 0.24,
        '9': 0.23,
        '10': 0.21,
        'J': 0.21,
        'Q': 0.21,
        'K': 0.21,
        'A': 0.17
    };

    // Adjust for dealer hitting on soft 17
    if (hitSoft17 && upCard.rank === 'A') {
        return 0.19; // Slightly higher bust probability when hitting on soft 17
    }

    return bustProbabilities[upCard.rank] || 0.25; // Default if rank not found
};

/**
 * Calculates the probability distribution of dealer's final hand values
 * @param upCard The dealer's face-up card
 * @param hitSoft17 Whether dealer hits on soft 17
 * @returns Distribution of final hand values (17-21 and bust)
 */
export const calculateDealerHandDistribution = (
    upCard: Card,
    hitSoft17: boolean = true
): Record<string, number> => {
    // This is a simplified model of dealer outcomes
    // Real simulation would require Monte Carlo simulation with remaining deck

    // Approximate distributions based on dealer's up card
    // Format: { '17': probability, '18': probability, ... '21': probability, 'bust': probability }
    const distributionTemplates: Record<string, Record<string, number>> = {
        '2': { '17': 0.14, '18': 0.14, '19': 0.14, '20': 0.12, '21': 0.11, 'bust': 0.35 },
        '3': { '17': 0.13, '18': 0.14, '19': 0.13, '20': 0.12, '21': 0.11, 'bust': 0.37 },
        '4': { '17': 0.13, '18': 0.13, '19': 0.13, '20': 0.11, '21': 0.10, 'bust': 0.40 },
        '5': { '17': 0.12, '18': 0.13, '19': 0.12, '20': 0.11, '21': 0.10, 'bust': 0.42 },
        '6': { '17': 0.12, '18': 0.12, '19': 0.12, '20': 0.10, '21': 0.10, 'bust': 0.44 },
        '7': { '17': 0.30, '18': 0.12, '19': 0.12, '20': 0.10, '21': 0.10, 'bust': 0.26 },
        '8': { '17': 0.12, '18': 0.30, '19': 0.12, '20': 0.12, '21': 0.10, 'bust': 0.24 },
        '9': { '17': 0.12, '18': 0.12, '19': 0.30, '20': 0.12, '21': 0.11, 'bust': 0.23 },
        '10': { '17': 0.12, '18': 0.12, '19': 0.12, '20': 0.30, '21': 0.13, 'bust': 0.21 },
        'J': { '17': 0.12, '18': 0.12, '19': 0.12, '20': 0.30, '21': 0.13, 'bust': 0.21 },
        'Q': { '17': 0.12, '18': 0.12, '19': 0.12, '20': 0.30, '21': 0.13, 'bust': 0.21 },
        'K': { '17': 0.12, '18': 0.12, '19': 0.12, '20': 0.30, '21': 0.13, 'bust': 0.21 },
        'A': { '17': 0.13, '18': 0.14, '19': 0.15, '20': 0.16, '21': 0.25, 'bust': 0.17 }
    };

    // Adjust for soft 17 rule
    let distribution = { ...distributionTemplates[upCard.rank] };

    if (hitSoft17 && upCard.rank === 'A') {
        // Hitting on soft 17 reduces 17s and slightly increases other outcomes
        distribution = {
            '17': 0.08,
            '18': 0.15,
            '19': 0.16,
            '20': 0.17,
            '21': 0.25,
            'bust': 0.19
        };
    }

    // If no template exists for the card, use a default distribution
    if (!distribution) {
        distribution = {
            '17': 0.14,
            '18': 0.14,
            '19': 0.14,
            '20': 0.14,
            '21': 0.14,
            'bust': 0.30
        };
    }

    return distribution;
};

/**
 * Determines the next best action for the dealer
 * @param hand Current dealer hand
 * @param options Game options
 * @returns The recommended dealer action
 */
export const getDealerNextAction = (
    hand: DealerHand,
    options?: GameOptions
): HandAction => {
    if (shouldDealerHit(hand, options)) {
        return 'hit';
    }
    return 'stand';
};

/**
 * Creates an initial dealer hand
 * @returns A new empty dealer hand
 */
export const createInitialDealerHand = (): DealerHand => {
    return {
        id: 'dealer',
        cards: [],
        values: [0],
        bestValue: 0,
        status: 'active',
        hasHiddenCard: false
    };
};

/**
 * Adds a hole card to the dealer hand (face down)
 * @param hand Dealer hand
 * @param card Card to add as hole card
 * @returns Updated dealer hand with hole card
 */
export const addHoleCard = (hand: DealerHand, card: Card): DealerHand => {
    const updatedHand = { ...hand };
    const holeCard = { ...card, face: 'down' as CardFace };

    updatedHand.cards.push(holeCard);

    // Note: We don't update the hand values since the hole card is not visible
    // Players should only see the value of the visible card

    return updatedHand;
};

/**
 * Reveals the dealer's hole card
 * @param hand Dealer hand
 * @returns Updated dealer hand with hole card revealed
 */
export const revealHoleCard = (hand: DealerHand): DealerHand => {
    const updatedHand = { ...hand };

    // Find the hole card and turn it face up
    updatedHand.cards = updatedHand.cards.map(card => ({
        ...card,
        face: 'up' as CardFace
    }));

    // Now recalculate hand values with all cards visible
    const handValues = calculateValues(updatedHand.cards);
    updatedHand.values = handValues;
    updatedHand.bestValue = determineBestValue(handValues);

    // Update hand status
    if (updatedHand.bestValue === 21 && updatedHand.cards.length === 2) {
        updatedHand.status = 'blackjack';
    }

    return updatedHand;
};

const dealerLogic = {
    shouldDealerHit,
    isSoft17,
    playDealerHand,
    calculateDealerBustProbability,
    calculateDealerHandDistribution,
    getDealerNextAction,
    createInitialDealerHand,
    addHoleCard,
    revealHoleCard
};

export default dealerLogic;