/**
 * Betting helper functions for the blackjack game
 */

import type { BettingOutcome, BettingStrategyType } from '@/types/bettingTypes';
import type { SideBetType } from '@/types/game';
import { SIDE_BET_PAYOUTS } from '@/lib/constants/gameConstants';

/**
 * Calculates the payout for a bet
 * @param betAmount The amount of the bet
 * @param result The result of the bet ('win', 'loss', 'push', 'blackjack', etc.)
 * @param blackjackPayout The blackjack payout multiplier (default 1.5)
 * @returns The payout amount (0 for loss)
 */
export const calculatePayout = (
    betAmount: number,
    result: string | null,
    blackjackPayout = 1.5
): number => {
    if (!result) return 0;

    switch (result) {
        case 'blackjack':
            return betAmount + betAmount * blackjackPayout;
        case 'win':
            return betAmount * 2;
        case 'push':
            return betAmount;
        case 'surrender':
            return betAmount / 2;
        case 'insurance':
            return betAmount * 2;
        default:
            return 0;
    }
};

/**
 * Calculates the payout for a side bet
 * @param betAmount The amount of the side bet
 * @param betType The type of side bet
 * @param outcomeType The specific outcome type (e.g., 'mixed', 'colored', 'perfect' for Perfect Pairs)
 * @returns The payout amount
 */
export const calculateSideBetPayout = (
    betAmount: number,
    betType: SideBetType,
    outcomeType: string | null
): number => {
    if (!outcomeType) return 0;

    // Get the payout multiplier from the constants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payouts = (SIDE_BET_PAYOUTS as any)[betType];

    if (!payouts || !payouts[outcomeType]) {
        return 0;
    }

    return betAmount * payouts[outcomeType];
};

/**
 * Calculates insurance payout
 * @param betAmount The original bet amount
 * @param dealerHasBlackjack Whether the dealer has blackjack
 * @returns The insurance payout (0 if dealer doesn't have blackjack)
 */
export const calculateInsurancePayout = (
    betAmount: number,
    dealerHasBlackjack: boolean
): number => {
    if (!dealerHasBlackjack) return 0;

    // Insurance costs half the original bet and pays 2:1
    const insuranceBet = betAmount / 2;
    return insuranceBet * 2;
};

/**
 * Validates if a bet is within the minimum and maximum limits
 * @param amount The bet amount
 * @param minBet The minimum bet allowed
 * @param maxBet The maximum bet allowed
 * @returns Whether the bet is valid
 */
export const isValidBet = (
    amount: number,
    minBet: number,
    maxBet: number
): boolean => {
    return amount >= minBet && amount <= maxBet;
};

/**
 * Calculates the recommended bet based on the true count
 * @param baseUnit The base betting unit
 * @param trueCount The true count
 * @param maxBet The maximum bet allowed
 * @returns The recommended bet amount
 */
export const calculateCountBasedBet = (
    baseUnit: number,
    trueCount: number,
    maxBet: number
): number => {
    // Simple count-based betting system
    // Bet base unit when count is 1 or less
    // Increase bet by baseUnit for each point of true count above 1

    if (trueCount <= 1) {
        return baseUnit;
    }

    const multiplier = Math.floor(trueCount);
    const recommendedBet = baseUnit * multiplier;

    // Cap at maximum bet
    return Math.min(recommendedBet, maxBet);
};

/**
 * Calculates the next bet for a given betting strategy
 * @param strategy The betting strategy to use
 * @param previousOutcomes Array of previous betting outcomes
 * @param currentBet The current bet amount
 * @param baseUnit The base betting unit
 * @param maxBet The maximum bet allowed
 * @param availableChips The available chips
 * @returns The recommended next bet
 */
export const calculateNextBet = (
    strategy: BettingStrategyType,
    previousOutcomes: BettingOutcome[],
    currentBet: number,
    baseUnit: number,
    maxBet: number,
    availableChips: number
): number => {
    // Default to current bet if no strategy provided
    if (!strategy || strategy === 'flat') {
        return Math.min(baseUnit, availableChips);
    }

    const lastOutcome = previousOutcomes.length > 0 ?
        previousOutcomes[previousOutcomes.length - 1] : null;

    // Implement different strategies
    switch (strategy) {
        case 'martingale':
            // Double after loss, return to base after win
            if (!lastOutcome || lastOutcome === 'win' || lastOutcome === 'push') {
                return Math.min(baseUnit, availableChips);
            } else {
                return Math.min(currentBet * 2, maxBet, availableChips);
            }

        case 'paroli':
            // Double after win (up to 3 consecutive wins), return to base after loss
            if (!lastOutcome || lastOutcome === 'loss') {
                return Math.min(baseUnit, availableChips);
            }

            // Count consecutive wins
            let consecutiveWins = 0;
            for (let i = previousOutcomes.length - 1; i >= 0; i--) {
                if (previousOutcomes[i] === 'win') {
                    consecutiveWins++;
                } else {
                    break;
                }
            }

            // Reset after 3 consecutive wins
            if (consecutiveWins >= 3) {
                return Math.min(baseUnit, availableChips);
            } else if (lastOutcome === 'win') {
                return Math.min(currentBet * 2, maxBet, availableChips);
            } else { // push
                return Math.min(currentBet, availableChips);
            }

        case 'oneThreeTwoSix':
            // 1-3-2-6 progression (bet 1×, 3×, 2×, 6× the base unit)
            const multipliers = [1, 3, 2, 6];

            if (!lastOutcome || lastOutcome === 'loss') {
                // Start or restart the sequence
                return Math.min(baseUnit * multipliers[0], availableChips);
            }

            // Count consecutive wins to determine position in sequence
            let consecutiveWins = 0;
            for (let i = previousOutcomes.length - 1; i >= 0; i--) {
                if (previousOutcomes[i] === 'win') {
                    consecutiveWins++;
                } else {
                    break;
                }
            }

            if (lastOutcome === 'win') {
                // Progress to next multiplier in sequence
                const nextPosition = Math.min(consecutiveWins, multipliers.length - 1);
                return Math.min(baseUnit * multipliers[nextPosition], maxBet, availableChips);
            } else { // push
                return Math.min(currentBet, availableChips);
            }

        case 'd_alembert':
            // Add one unit after loss, subtract one unit after win
            if (!lastOutcome) {
                return Math.min(baseUnit, availableChips);
            }

            if (lastOutcome === 'win') {
                return Math.min(Math.max(currentBet - baseUnit, baseUnit), availableChips);
            } else if (lastOutcome === 'loss') {
                return Math.min(currentBet + baseUnit, maxBet, availableChips);
            } else { // push
                return Math.min(currentBet, availableChips);
            }

        case 'fibonacci':
            // Use Fibonacci sequence for bet progression
            const generateFibonacci = (length: number): number[] => {
                const sequence = [1, 1];
                for (let i = 2; i < length; i++) {
                    sequence.push(sequence[i - 1] + sequence[i - 2]);
                }
                return sequence;
            };

            // Generate Fibonacci sequence
            const fibonacci = generateFibonacci(10); // 10 steps should be enough

            if (!lastOutcome) {
                return Math.min(baseUnit * fibonacci[0], availableChips);
            }

            // Find current position in sequence
            const currentIndex = fibonacci.findIndex(value => value * baseUnit === currentBet);
            let nextIndex = 0;

            if (currentIndex === -1) {
                // If we can't find the position, start over
                nextIndex = 0;
            } else if (lastOutcome === 'win') {
                // After a win, move back two steps
                nextIndex = Math.max(currentIndex - 2, 0);
            } else if (lastOutcome === 'loss') {
                // After a loss, move up one step
                nextIndex = Math.min(currentIndex + 1, fibonacci.length - 1);
            } else { // push
                nextIndex = currentIndex;
            }

            return Math.min(baseUnit * fibonacci[nextIndex], maxBet, availableChips);

        default:
            return Math.min(baseUnit, availableChips);
    }
};

/**
 * Gets the risk level of a betting strategy
 * @param strategy The betting strategy
 * @returns A risk level from 1 (lowest) to 5 (highest)
 */
export const getBettingStrategyRiskLevel = (
    strategy: BettingStrategyType
): number => {
    const riskLevels: Record<BettingStrategyType, number> = {
        'flat': 1,
        'd_alembert': 2,
        'oneThreeTwoSix': 2,
        'paroli': 3,
        'fibonacci': 4,
        'martingale': 5,
        'labouchere': 4,
        'oscar': 3
    };

    return riskLevels[strategy] || 1;
};

/**
 * Calculates the win rate based on previous outcomes
 * @param outcomes Array of previous betting outcomes
 * @returns The win rate as a decimal (0-1)
 */
export const calculateWinRate = (outcomes: BettingOutcome[]): number => {
    if (outcomes.length === 0) return 0;

    const wins = outcomes.filter(outcome => outcome === 'win').length;
    return wins / outcomes.length;
};

/**
 * Calculates the expected value of a bet
 * @param winProbability The probability of winning (0-1)
 * @param betAmount The bet amount
 * @param payoutMultiplier The payout multiplier (default 1 for even money)
 * @returns The expected value of the bet
 */
export const calculateExpectedValue = (
    winProbability: number,
    betAmount: number,
    payoutMultiplier = 1
): number => {
    const winAmount = betAmount * payoutMultiplier;
    const loseProbability = 1 - winProbability;

    // Expected Value = (win probability × win amount) - (lose probability × lose amount)
    return (winProbability * winAmount) - (loseProbability * betAmount);
};

/**
 * Formats bet amount for display
 * @param amount The bet amount
 * @param currency The currency symbol (default '$')
 * @returns Formatted bet string
 */
export const formatBetAmount = (amount: number, currency = '$'): string => {
    return `${currency}${amount.toLocaleString()}`;
};

/**
 * Groups bets into standard increments
 * @param allBets Array of all bet amounts
 * @returns Object with bets grouped by standard increments
 */
export const groupBetsByIncrement = (allBets: number[]): Record<string, number[]> => {
    const groups: Record<string, number[]> = {
        'small': [],   // 1-9
        'medium': [],  // 10-49
        'large': [],   // 50-99
        'xlarge': []   // 100+
    };

    for (const bet of allBets) {
        if (bet < 10) {
            groups.small.push(bet);
        } else if (bet < 50) {
            groups.medium.push(bet);
        } else if (bet < 100) {
            groups.large.push(bet);
        } else {
            groups.xlarge.push(bet);
        }
    }

    return groups;
};