/**
 * European blackjack rules implementation
 */
import { GameRules, GameOptions } from '../../../types/gameTypes';
import { Hand, HandAction } from '../../../types/handTypes';
import { Bet } from '../../../types/betTypes';
import { Card, Deck } from '../../../types/cardTypes';
import {
    isBlackjack,
    getAvailableActions
} from '../../game/gameEngine';

// European blackjack game options
export const EUROPEAN_GAME_OPTIONS: GameOptions = {
    variant: 'european',
    numberOfDecks: 2,           // European blackjack typically uses 2 decks
    dealerHitsSoft17: false,    // Dealer stands on soft 17 in European rules
    blackjackPays: 1.5,         // 3:2 payout for blackjack
    doubleAfterSplit: false,    // Cannot double after split in European rules
    resplitAces: false,
    lateSurrender: false,       // European rules typically don't allow surrender
    maxSplitHands: 3,
    penetration: 0.75,
    tableLimits: {
        minimumBet: 5,
        maximumBet: 500
    },
    payoutRules: {
        blackjack: 1.5,
        regularWin: 1,
        insurance: 2,
        surrender: 0,             // No surrender in European rules
        sideBets: {
            perfectPairs: 0,
            '21+3': 0,
            luckyLadies: 0,
            royalMatch: 0,
            luckyLucky: 0,
            inBetween: 0,
            overUnder13: 0
        }
    },
    allowedActions: ['hit', 'stand', 'double', 'split'], // No surrender or insurance in European rules
    availableSideBets: [],
    deckRotationStrategy: 'perShoe'
};

/**
 * European blackjack rules implementation
 */
const europeanRules: GameRules = {
    variant: 'european',
    description: 'European blackjack with traditional rules: 2 decks, dealer stands on soft 17, no dealer peek, double only on 9-11',
    options: EUROPEAN_GAME_OPTIONS,

    /**
     * Get available actions for a hand in European blackjack
     * In European rules, doubling is typically only allowed on 9, 10, or 11
     */
    getAvailableActions: (hand: Hand, dealerUpCard?: Card): HandAction[] => {
        // Get standard actions
        const standardActions = getAvailableActions(hand, dealerUpCard, EUROPEAN_GAME_OPTIONS);

        // European rule: Can only double on 9, 10, or 11
        if (hand.cards.length === 2) {
            const handValue = hand.bestValue;

            if (handValue >= 9 && handValue <= 11) {
                // Double is allowed
                if (!standardActions.includes('double')) {
                    standardActions.push('double');
                }
            } else {
                // Remove double if it's in the standard actions
                const doubleIndex = standardActions.indexOf('double');
                if (doubleIndex !== -1) {
                    standardActions.splice(doubleIndex, 1);
                }
            }
        }

        // European rule: No insurance (dealer doesn't peek for blackjack)
        const insuranceIndex = standardActions.indexOf('insurance');
        if (insuranceIndex !== -1) {
            standardActions.splice(insuranceIndex, 1);
        }

        // European rule: No surrender
        const surrenderIndex = standardActions.indexOf('surrender');
        if (surrenderIndex !== -1) {
            standardActions.splice(surrenderIndex, 1);
        }

        return standardActions;
    },

    /**
     * Check if a hand is a blackjack in European rules
     * Same as classic rules
     */
    isBlackjack: (hand: Hand): boolean => {
        return isBlackjack(hand);
    },

    /**
     * Calculate payout for a bet based on result
     */
    calculatePayout: (bet: Bet, result: string): number => {
        const amount = bet.amount;

        switch (result) {
            case 'blackjack':
                return amount * (1 + EUROPEAN_GAME_OPTIONS.blackjackPays);
            case 'win':
                return amount * 2; // Original bet + 1:1 win
            case 'push':
                return amount; // Return original bet
            case 'loss':
                return 0; // Lose bet
            // European rules don't have surrender or insurance, but including for completeness
            case 'surrender':
                return 0;
            case 'insurance':
                return amount * 3; // Original bet + 2:1 insurance payout
            default:
                return 0;
        }
    },

    /**
     * Determine if dealer must hit on a specific hand value
     */
    dealerMustHitOn: (dealerValue: number): boolean => {
        // In European rules, dealer hits on 16 or less and stands on all 17s (including soft 17)
        return dealerValue < 17;
    },

    /**
     * Determine if dealer must stand on a specific hand value
     */
    dealerMustStandOn: (dealerValue: number): boolean => {
        // In European rules, dealer stands on any 17 or more
        return dealerValue >= 17;
    },

    /**
     * Determine if the deck should be reshuffled
     * In European rules, decks are typically reshuffled when the penetration threshold is reached
     */
    shouldReshuffleDeck: (deck: Deck): boolean => {
        const cardsRemaining = deck.remaining;
        const totalCards = deck.cards.length;
        const penetrationThreshold = EUROPEAN_GAME_OPTIONS.penetration;

        // Reshuffle when the remaining cards percentage falls below the penetration threshold
        return (cardsRemaining / totalCards) < (1 - penetrationThreshold);
    }
};

export default europeanRules;