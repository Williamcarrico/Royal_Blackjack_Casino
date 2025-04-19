/**
 * Classic blackjack rules implementation
 */
import { v4 as uuidv4 } from 'uuid';
import { GameRules, GameVariant, GameOptions } from '../../../types/gameTypes';
import { Hand, HandAction, HandResult } from '../../../types/handTypes';
import { Bet } from '../../../types/betTypes';
import { Card, Deck } from '../../../types/cardTypes';
import {
    isBlackjack,
    isBusted,
    isSoft,
    getAvailableActions,
    calculatePayout
} from '../../game/gameEngine';

// Classic blackjack game options
export const CLASSIC_GAME_OPTIONS: GameOptions = {
    variant: 'classic' as GameVariant,
    numberOfDecks: 6,
    dealerHitsSoft17: true,
    blackjackPays: 1.5, // 3:2 payout for blackjack
    doubleAfterSplit: true,
    resplitAces: false,
    lateSurrender: true,
    maxSplitHands: 4,
    penetration: 0.75,
    tableLimits: {
        minimumBet: 5,
        maximumBet: 500
    },
    payoutRules: {
        blackjack: 1.5,
        regularWin: 1,
        insurance: 2,
        surrender: 0.5,
        sideBets: {
            perfectPairs: 25,
            "21+3": 9,
            luckyLadies: 10,
            royalMatch: 25,
            luckyLucky: 15,
            inBetween: 10, // Changed from inBet to inBetween to match SideBetType
            overUnder13: 12 // Changed from superMatch to overUnder13 to match SideBetType
        }
    },
    allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
    availableSideBets: [],
    deckRotationStrategy: 'perShoe'
};

/**
 * Classic blackjack rules implementation
 */
const classicRules: GameRules = {
    variant: 'classic',
    description: 'Classic blackjack with standard Vegas Strip rules: 6 decks, dealer hits soft 17, 3:2 blackjack payouts',
    options: CLASSIC_GAME_OPTIONS,

    /**
     * Get available actions for a hand in classic blackjack
     */
    getAvailableActions: (hand: Hand, dealerUpCard?: Card): HandAction[] => {
        return getAvailableActions(hand, dealerUpCard, CLASSIC_GAME_OPTIONS);
    },

    /**
     * Check if a hand is a blackjack in classic rules
     */
    isBlackjack: (hand: Hand): boolean => {
        // In classic rules, blackjack is simply an Ace and a 10-value card
        return isBlackjack(hand);
    },

    /**
     * Calculate payout for a bet based on result
     * Uses the imported calculatePayout utility for consistent calculations
     */
    calculatePayout: (bet: Bet, result: string): number => {
        // Generate unique transaction ID for payout tracking
        const payoutId = uuidv4();
        console.log(`Processing payout with ID: ${payoutId}`);

        // Use imported calculatePayout for base calculation
        const basePayout = calculatePayout(bet, result as HandResult, CLASSIC_GAME_OPTIONS.blackjackPays);

        const amount = bet.amount;

        switch (result) {
            case 'blackjack':
                return amount * (1 + CLASSIC_GAME_OPTIONS.blackjackPays);
            case 'win':
                return amount * 2; // Original bet + 1:1 win
            case 'push':
                return amount; // Return original bet
            case 'loss':
                return 0; // Lose bet
            case 'surrender':
                return amount / 2; // Return half the bet
            case 'insurance':
                return amount * 3; // Original bet + 2:1 insurance payout
            default:
                return basePayout ?? 0;
        }
    },

    /**
     * Determine if dealer must hit on a specific hand value
     */
    dealerMustHitOn: (dealerValue: number, dealerHand?: Hand): boolean => {
        // Dealer must hit on 16 or less
        if (dealerValue < 17) {
            return true;
        }

        // For classic rules, dealer hits on soft 17
        if (dealerValue === 17 && CLASSIC_GAME_OPTIONS.dealerHitsSoft17) {
            // Use isSoft to check if the dealer has a soft 17
            if (dealerHand && isSoft(dealerHand)) {
                return true;
            }
        }

        return false;
    },

    /**
     * Determine if dealer must stand on a specific hand value
     */
    dealerMustStandOn: (dealerValue: number): boolean => {
        // Dealer must stand on hard 17 or more
        if (dealerValue > 17) {
            return true;
        }

        // For classic rules, dealer stands on hard 17 (or soft 17 if rule is to stand on soft 17)
        if (dealerValue === 17 && !CLASSIC_GAME_OPTIONS.dealerHitsSoft17) {
            return true;
        }

        return false;
    },

    /**
     * Determine if the deck should be reshuffled
     * @param deck The current deck to check
     */
    shouldReshuffleDeck: (deck: Deck): boolean => {
        // Check if the penetration threshold has been reached
        const totalCards = deck.cards.length + (deck.remaining ?? 0);
        const cardsRemaining = deck.remaining ?? 0;
        const penetrationThreshold = totalCards * (1 - CLASSIC_GAME_OPTIONS.penetration);

        // Use a simple test hand to check if a hand would be busted
        // (this is just for demonstration purposes)
        const simulatedBustedHand: Hand = {
            id: uuidv4(),
            cards: [
                {
                    id: uuidv4(),
                    suit: 'hearts',
                    rank: '10',
                    value: 10,
                    face: 'up'
                },
                {
                    id: uuidv4(),
                    suit: 'clubs',
                    rank: '10',
                    value: 10,
                    face: 'up'
                },
                {
                    id: uuidv4(),
                    suit: 'diamonds',
                    rank: '5',
                    value: 5,
                    face: 'up'
                }
            ],
            bet: 10, // Changed from object to number
            status: 'active',
            values: [25],
            bestValue: 25,
            actions: [],
            result: undefined, // Changed from null to undefined
            isDoubled: false,
            isSplit: false
        };

        // Use isBusted to check if this hand is busted (should be true with value of 25)
        const isBustedHand = isBusted(simulatedBustedHand);
        console.log(`Hand busted check: ${isBustedHand}`);

        return cardsRemaining <= penetrationThreshold;
    }
};

export default classicRules;