// src/domains/betting/bettingStrategies.domain.ts
// Purpose: Domain-specific implementation of betting strategies

import {
    BetOutcome,
    BettingStrategyContext,
    BettingStrategyFunction,
    MartingaleConfig,
    FixedBetConfig,
    FibonacciConfig,
    DAlembertConfig,
    OscarsGrindConfig,
    ParlayConfig,
    BettingStrategyConfig
} from './bettingTypes';

import { getBettingStrategy as getAppBettingStrategy } from '../../domains/betting/bettingStrategies';
import { BettingStrategyType } from '../../types/betTypes';

import {
    createDomainStrategyFunction
} from './bettingAdapter';

/**
 * Enforces limits on a bet amount
 */
const enforceBetLimits = (amount: number, minBet: number, maxBet: number): number => {
    return Math.max(minBet, Math.min(amount, maxBet));
};

/**
 * Ensures bet doesn't exceed the player's current balance
 */
const enforceBalanceLimit = (amount: number, currentBalance: number): number => {
    return Math.min(amount, currentBalance);
};

/**
 * Fixed betting strategy - always bet the same amount
 */
export const fixedBetStrategy = (config: FixedBetConfig): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        const { currentBalance, minBet, maxBet } = context;
        const amount = config.betAmount;

        return enforceBalanceLimit(
            enforceBetLimits(amount, minBet, maxBet),
            currentBalance
        );
    };
};

/**
 * Martingale betting strategy - double after loss, reset after win
 */
export const martingaleStrategy = (config: MartingaleConfig): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        const { currentBalance, minBet, maxBet, lastBet } = context;
        const baseBet = config.baseBet;
        const maxSteps = config.maxSteps ?? 5; // Default to 5 max steps

        // If no last bet or it was a win, use base bet
        if (!lastBet || lastBet.outcome === BetOutcome.WIN || lastBet.outcome === BetOutcome.PUSH) {
            return enforceBalanceLimit(
                enforceBetLimits(baseBet, minBet, maxBet),
                currentBalance
            );
        }

        // If last bet was a loss, double the bet (up to maxSteps)
        if (lastBet.outcome === BetOutcome.LOSE) {
            // Determine how many times to double (from previous bets)
            let stepCount = 1;
            let prevBet = lastBet.amount;

            // Calculate steps based on previous bet amount
            while (prevBet > baseBet * 1.5 && stepCount < maxSteps) {
                prevBet = prevBet / 2;
                stepCount++;
            }

            // Don't exceed maxSteps
            if (stepCount >= maxSteps) {
                return enforceBalanceLimit(
                    enforceBetLimits(baseBet, minBet, maxBet),
                    currentBalance
                );
            }

            const nextBet = lastBet.amount * 2;
            return enforceBalanceLimit(
                enforceBetLimits(nextBet, minBet, maxBet),
                currentBalance
            );
        }

        // Default fallback
        return enforceBalanceLimit(
            enforceBetLimits(baseBet, minBet, maxBet),
            currentBalance
        );
    };
};

/**
 * Fibonacci betting strategy - follow Fibonacci sequence for losses
 */
export const fibonacciStrategy = (config: FibonacciConfig): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        const { currentBalance, minBet, maxBet, previousBets } = context;
        const baseBet = config.baseBet;
        const maxStep = config.maxStep ?? 8; // Default max step in sequence

        // Generate Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21, ...
        const sequence = [1, 1];
        for (let i = 2; i < maxStep; i++) {
            sequence.push(sequence[i - 1]! + sequence[i - 2]!);
        }

        if (!previousBets || previousBets.length === 0) {
            return enforceBalanceLimit(
                enforceBetLimits(baseBet, minBet, maxBet),
                currentBalance
            );
        }

        // Determine position in sequence based on recent losses
        let position = 0;
        let consecutiveLosses = 0;

        // Count consecutive losses
        for (let i = previousBets.length - 1; i >= 0; i--) {
            const bet = previousBets[i];
            if (bet && bet.status === 'lost') {
                consecutiveLosses++;
            } else if (bet && (bet.status === 'won' || bet.status === 'push')) {
                break;
            }
        }

        // Set position based on consecutive losses (capped at maxStep)
        position = Math.min(consecutiveLosses, maxStep - 1);

        // Calculate next bet
        const multiplier = sequence[position] ?? 1; // Default to 1 if undefined
        const nextBet = baseBet * multiplier;

        return enforceBalanceLimit(
            enforceBetLimits(nextBet, minBet, maxBet),
            currentBalance
        );
    };
};

/**
 * D'Alembert betting strategy - increase by one unit after loss, decrease after win
 */
export const dAlembertStrategy = (config: DAlembertConfig): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        const { currentBalance, minBet, maxBet, lastBet } = context;
        const baseBet = config.baseBet;
        const unitSize = config.unitSize ?? baseBet;

        if (!lastBet) {
            return enforceBalanceLimit(
                enforceBetLimits(baseBet, minBet, maxBet),
                currentBalance
            );
        }

        let nextBet = lastBet.amount;

        if (lastBet.outcome === BetOutcome.WIN) {
            // Decrease by one unit after a win (but not below baseBet)
            nextBet = Math.max(baseBet, nextBet - unitSize);
        } else if (lastBet.outcome === BetOutcome.LOSE) {
            // Increase by one unit after a loss
            nextBet = nextBet + unitSize;
        }

        return enforceBalanceLimit(
            enforceBetLimits(nextBet, minBet, maxBet),
            currentBalance
        );
    };
};

/**
 * Oscar's Grind betting strategy - increase bet by one unit after a win
 */
export const oscarsGrindStrategy = (config: OscarsGrindConfig): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        const { currentBalance, minBet, maxBet, previousBets } = context;
        const baseBet = config.baseBet;
        const targetProfit = config.targetProfit ?? baseBet; // Default to one unit profit

        if (!previousBets || previousBets.length === 0) {
            return enforceBalanceLimit(
                enforceBetLimits(baseBet, minBet, maxBet),
                currentBalance
            );
        }

        // Find current profit in this cycle
        let currentProfit = 0;
        let currentBet = baseBet;
        let lastWasWin = false;

        for (const bet of previousBets) {
            if (bet && bet.status === 'won') {
                currentProfit += (bet.payout ?? bet.amount) - bet.amount;
                lastWasWin = true;
            } else if (bet && bet.status === 'lost') {
                currentProfit -= bet.amount;
                lastWasWin = false;
            }

            // Track the last bet amount
            if (bet) {
                currentBet = bet.amount;
            }
        }

        // If we've reached our target profit, reset
        if (currentProfit >= targetProfit) {
            return enforceBalanceLimit(
                enforceBetLimits(baseBet, minBet, maxBet),
                currentBalance
            );
        }

        // If last bet was a win and we haven't reached our target, increase by one unit
        if (lastWasWin) {
            currentBet = Math.min(currentBet + baseBet, 4 * baseBet); // Cap at 4 units
        }

        return enforceBalanceLimit(
            enforceBetLimits(currentBet, minBet, maxBet),
            currentBalance
        );
    };
};

/**
 * Parlay (Let it Ride) strategy - let winnings ride, reset after loss
 */
export const parlayStrategy = (config: ParlayConfig): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        const { currentBalance, minBet, maxBet, lastBet, previousBets } = context;
        const baseBet = config.baseBet;
        const maxConsecutiveWins = config.maxConsecutiveWins ?? 3; // Default max consecutive wins

        if (!lastBet) {
            return enforceBalanceLimit(
                enforceBetLimits(baseBet, minBet, maxBet),
                currentBalance
            );
        }

        // Find consecutive wins
        let consecutiveWins = 0;

        if (previousBets) {
            for (let i = previousBets.length - 1; i >= 0; i--) {
                const bet = previousBets[i];
                if (bet && bet.status === 'won') {
                    consecutiveWins++;
                } else {
                    break;
                }
            }
        }

        // If last bet was a win and we haven't reached max consecutive wins
        if (lastBet.outcome === BetOutcome.WIN && consecutiveWins < maxConsecutiveWins) {
            // Let winnings ride (bet the payout)
            const nextBet = lastBet.payout ?? lastBet.amount * 2;
            return enforceBalanceLimit(
                enforceBetLimits(nextBet, minBet, maxBet),
                currentBalance
            );
        }

        // Otherwise, reset to base bet
        return enforceBalanceLimit(
            enforceBetLimits(baseBet, minBet, maxBet),
            currentBalance
        );
    };
};

/**
 * Returns a strategy function by name, either using a domain-specific implementation
 * or adapting from the application-wide strategy implementation
 */
export const getBettingStrategy = (
    strategyName: string,
    config: BettingStrategyConfig = {}
): BettingStrategyFunction => {
    // Check if we have a domain-specific implementation first
    switch (strategyName) {
        case 'fixed':
            return fixedBetStrategy(config as FixedBetConfig);
        case 'martingale':
            return martingaleStrategy(config as MartingaleConfig);
        case 'fibonacci':
            return fibonacciStrategy(config as FibonacciConfig);
        case 'dAlembert':
            return dAlembertStrategy(config as DAlembertConfig);
        case 'oscarsGrind':
            return oscarsGrindStrategy(config as OscarsGrindConfig);
        case 'parlay':
            return parlayStrategy(config as ParlayConfig);
        default:
            // Fall back to adapting the application-wide strategy
            try {
                const appStrategy = getAppBettingStrategy(strategyName as BettingStrategyType);
                return createDomainStrategyFunction(appStrategy);
            } catch {
                // If strategy not found, return fixed bet as default
                console.warn(`Strategy '${strategyName}' not found, using fixed bet strategy`);
                // Safe to cast because we're creating a new object with betAmount property
                return fixedBetStrategy({ betAmount: ('baseBet' in config ? config.baseBet : 10) as number });
            }
    }
};