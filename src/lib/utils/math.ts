/**
 * Math utilities for the blackjack game application
 */

import type { Card, Hand } from '@/types/gameTypes';

/**
 * Calculates the probability of busting if hitting with current hand
 * @param hand The current hand
 * @param remainingDeckCount The number of remaining decks
 * @param dealtCards Array of cards already dealt
 */
export const calculateBustProbability = (
    hand: Hand,
    remainingDeckCount: number,
    dealtCards: Card[] = []
): number => {
    // Find best non-busting value of hand
    const bestValue = Math.max(...hand.values.filter(v => v <= 21));
    if (bestValue === 0) return 1; // Already busted

    // Calculate how many points until busting
    const pointsUntilBust = 21 - bestValue;

    // Count remaining cards in deck
    const cardsPerDeck = 52;
    const totalRemainingCards = remainingDeckCount * cardsPerDeck - dealtCards.length;

    // Count cards that would cause bust
    const cardValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; // Ace=1, J/Q/K=10

    // Adjust for already dealt cards
    const dealtCardCounts = new Map<number, number>();
    for (const card of dealtCards) {
        let value = parseInt(card.rank);
        if (isNaN(value)) {
            value = card.rank === 'A' ? 1 : 10; // Ace=1, J/Q/K=10
        }
        dealtCardCounts.set(value, (dealtCardCounts.get(value) || 0) + 1);
    }

    // Count cards that would bust
    let bustingCards = 0;
    for (const value of cardValues) {
        if (value > pointsUntilBust) {
            // Each value comes in 4 suits per deck
            const cardsOfThisValue = 4 * remainingDeckCount - (dealtCardCounts.get(value) || 0);
            bustingCards += cardsOfThisValue;
        }
    }

    // Calculate probability
    return bustingCards / totalRemainingCards;
};

/**
 * Calculates the probability of dealer busting
 * @param dealerUpCard The dealer's up card
 * @param remainingDeckCount The number of remaining decks
 * @param dealtCards Array of cards already dealt
 * @param dealerHitsSoft17 Whether the dealer hits on soft 17
 */
export const calculateDealerBustProbability = (
    dealerUpCard: Card,
    remainingDeckCount: number,
    dealtCards: Card[] = [],
    dealerHitsSoft17 = true
): number => {
    // Probabilities based on dealer's up card (simulated results)
    // These are approximate values that can be refined with more precise simulations
    const bustProbabilities: Record<string, number> = {
        '2': 0.35,
        '3': 0.37,
        '4': 0.40,
        '5': 0.43,
        '6': 0.42,
        '7': 0.26,
        '8': 0.24,
        '9': 0.23,
        '10': 0.21,
        'J': 0.21,
        'Q': 0.21,
        'K': 0.21,
        'A': 0.17,
    };

    // Adjust based on dealer hits soft 17 rule
    if (!dealerHitsSoft17) {
        // Slightly lower bust probability when dealer stands on soft 17
        for (const key in bustProbabilities) {
            bustProbabilities[key] *= 0.95;
        }
    }

    return bustProbabilities[dealerUpCard.rank] || 0.25;
};

/**
 * Calculates the optimal strategy move
 * @param playerHand The player's hand
 * @param dealerUpCard The dealer's up card
 * @param canSplit Whether splitting is allowed
 * @param canDoubleDown Whether doubling down is allowed
 * @param canSurrender Whether surrender is allowed
 */
export const calculateOptimalMove = (
    playerHand: Hand,
    dealerUpCard: Card,
    canSplit = true,
    canDoubleDown = true,
    canSurrender = true
): 'hit' | 'stand' | 'double' | 'split' | 'surrender' => {
    // Get player's best hand value
    const handValue = Math.max(...playerHand.values.filter(v => v <= 21));

    // Check if hand has an Ace counted as 11
    const hasSoftAce = playerHand.isSoft;

    // Check if hand is a pair
    const isPair = playerHand.canSplit;

    // Dealer's up card value (10 for face cards)
    let dealerValue = parseInt(dealerUpCard.rank);
    if (isNaN(dealerValue)) {
        dealerValue = dealerUpCard.rank === 'A' ? 11 : 10;
    }

    // Strategy for pairs
    if (isPair && canSplit && playerHand.cards.length === 2) {
        // Get the card value for determining pair type
        const cardID = playerHand.cards[0];
        const cardValue = parseInt(cardID.toString());

        // Pairs of A and 8 should always be split
        if (cardID === 'A' || cardID === '8') return 'split';

        // Never split pairs of 10s, 5s
        if (cardID === '10' || cardID === 'J' || cardID === 'Q' || cardID === 'K') return 'stand';
        if (cardID === '5') return dealerValue <= 9 && canDoubleDown ? 'double' : 'hit';

        // Split pairs of 9 unless dealer has 7, 10, or A
        if (cardID === '9') {
            if (dealerValue !== 7 && dealerValue !== 10 && dealerValue !== 11) return 'split';
            return 'stand';
        }

        // Split pairs of 7 if dealer has 2-7
        if (cardID === '7') return dealerValue <= 7 ? 'split' : 'hit';

        // Split pairs of 6 if dealer has 2-6
        if (cardID === '6') return dealerValue <= 6 ? 'split' : 'hit';

        // Split pairs of 4 if dealer has 5-6
        if (cardID === '4') return (dealerValue === 5 || dealerValue === 6) ? 'split' : 'hit';

        // Split pairs of 2 or 3 if dealer has 2-7
        if (cardID === '2' || cardID === '3') return dealerValue <= 7 ? 'split' : 'hit';
    }

    // Strategy for soft hands (with Ace counted as 11)
    if (hasSoftAce) {
        // Soft 20 (A,9) always stands
        if (handValue === 20) return 'stand';

        // Soft 19 (A,8) doubles against dealer 6, otherwise stands
        if (handValue === 19) return dealerValue === 6 && canDoubleDown ? 'double' : 'stand';

        // Soft 18 (A,7) doubles against dealer 2-6, stands against 7-8, hits against 9-A
        if (handValue === 18) {
            if (dealerValue >= 2 && dealerValue <= 6 && canDoubleDown) return 'double';
            if (dealerValue >= 7 && dealerValue <= 8) return 'stand';
            return 'hit';
        }

        // Soft 17 (A,6) doubles against dealer 3-6, otherwise hits
        if (handValue === 17) return (dealerValue >= 3 && dealerValue <= 6 && canDoubleDown) ? 'double' : 'hit';

        // Soft 16 (A,5) doubles against dealer 4-6, otherwise hits
        if (handValue === 16) return (dealerValue >= 4 && dealerValue <= 6 && canDoubleDown) ? 'double' : 'hit';

        // Soft 15 (A,4) doubles against dealer 4-6, otherwise hits
        if (handValue === 15) return (dealerValue >= 4 && dealerValue <= 6 && canDoubleDown) ? 'double' : 'hit';

        // Soft 14 (A,3) doubles against dealer 5-6, otherwise hits
        if (handValue === 14) return (dealerValue >= 5 && dealerValue <= 6 && canDoubleDown) ? 'double' : 'hit';

        // Soft 13 (A,2) doubles against dealer 5-6, otherwise hits
        if (handValue === 13) return (dealerValue >= 5 && dealerValue <= 6 && canDoubleDown) ? 'double' : 'hit';
    }

    // Strategy for hard hands

    // Hard 17+ always stands
    if (handValue >= 17) return 'stand';

    // Hard 16 stands against dealer 2-6, surrenders against 9-A if allowed, otherwise hits
    if (handValue === 16) {
        if (dealerValue <= 6) return 'stand';
        if (dealerValue >= 9 && canSurrender) return 'surrender';
        return 'hit';
    }

    // Hard 15 stands against dealer 2-6, surrenders against 10-A if allowed, otherwise hits
    if (handValue === 15) {
        if (dealerValue <= 6) return 'stand';
        if ((dealerValue === 10 || dealerValue === 11) && canSurrender) return 'surrender';
        return 'hit';
    }

    // Hard 13-14 stands against dealer 2-6, otherwise hits
    if (handValue >= 13 && handValue <= 14) {
        return dealerValue <= 6 ? 'stand' : 'hit';
    }

    // Hard 12 stands against dealer 4-6, otherwise hits
    if (handValue === 12) {
        return (dealerValue >= 4 && dealerValue <= 6) ? 'stand' : 'hit';
    }

    // Hard 11 always doubles if allowed, otherwise hits
    if (handValue === 11) {
        return canDoubleDown ? 'double' : 'hit';
    }

    // Hard 10 doubles against dealer 2-9 if allowed, otherwise hits
    if (handValue === 10) {
        return (dealerValue <= 9 && canDoubleDown) ? 'double' : 'hit';
    }

    // Hard 9 doubles against dealer 3-6 if allowed, otherwise hits
    if (handValue === 9) {
        return (dealerValue >= 3 && dealerValue <= 6 && canDoubleDown) ? 'double' : 'hit';
    }

    // Hard 8 or less always hits
    return 'hit';
};

/**
 * Calculates the expected value of a bet
 * @param winProbability The probability of winning
 * @param payoutMultiplier The payout multiplier (e.g., 1 for even money, 1.5 for blackjack)
 * @param betAmount The bet amount
 */
export const calculateExpectedValue = (
    winProbability: number,
    payoutMultiplier: number,
    betAmount: number
): number => {
    const winAmount = betAmount * payoutMultiplier;
    const loseAmount = betAmount;

    // Expected value = (win probability × win amount) - (lose probability × lose amount)
    return (winProbability * winAmount) - ((1 - winProbability) * loseAmount);
};

/**
 * Calculates the win probability based on player hand vs dealer up card
 * @param playerHand The player's hand
 * @param dealerUpCard The dealer's up card
 * @param remainingDeckCount The number of remaining decks
 */
export const calculateWinProbability = (
    playerHand: Hand,
    dealerUpCard: Card,
    remainingDeckCount: number
): number => {
    // Get player's best hand value
    const playerValue = Math.max(...playerHand.values.filter(v => v <= 21));

    // If player is busted, win probability is 0
    if (playerValue === 0) return 0;

    // If player has blackjack, win probability is high
    if (playerHand.isBlackjack) {
        // Unless dealer also has potential blackjack
        if (dealerUpCard.rank === 'A' || dealerUpCard.rank === '10' ||
            dealerUpCard.rank === 'J' || dealerUpCard.rank === 'Q' ||
            dealerUpCard.rank === 'K') {
            return 0.75; // ~25% chance dealer also has blackjack
        }
        return 0.995; // ~0.5% chance of dealer getting blackjack without A or 10-value showing
    }

    // Calculate dealer bust probability
    const dealerBustProb = calculateDealerBustProbability(dealerUpCard, remainingDeckCount);

    // Win probability is approximately:
    // - Dealer bust probability, plus
    // - Probability of player having better hand when dealer doesn't bust

    // Approximation based on player's hand value
    let playerWinAgainstNonBustProb = 0;

    if (playerValue >= 19) playerWinAgainstNonBustProb = 0.8;
    else if (playerValue === 18) playerWinAgainstNonBustProb = 0.7;
    else if (playerValue === 17) playerWinAgainstNonBustProb = 0.5;
    else if (playerValue === 16) playerWinAgainstNonBustProb = 0.3;
    else if (playerValue === 15) playerWinAgainstNonBustProb = 0.25;
    else if (playerValue <= 14) playerWinAgainstNonBustProb = 0.2;

    // Adjust based on dealer's up card
    let dealerValue = parseInt(dealerUpCard.rank);
    if (isNaN(dealerValue)) {
        dealerValue = dealerUpCard.rank === 'A' ? 11 : 10;
    }

    if (dealerValue >= 7) {
        // Stronger dealer card reduces win probability
        playerWinAgainstNonBustProb *= 0.8;
    } else if (dealerValue <= 6) {
        // Weaker dealer card increases win probability
        playerWinAgainstNonBustProb *= 1.2;
    }

    // Cap the non-bust win probability at 0.95
    playerWinAgainstNonBustProb = Math.min(playerWinAgainstNonBustProb, 0.95);

    // Total win probability
    return dealerBustProb + ((1 - dealerBustProb) * playerWinAgainstNonBustProb);
};