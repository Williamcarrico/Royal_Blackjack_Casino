/**
 * Betting strategies implementation for progressive betting
 */
import { BettingStrategy, BettingStrategyType, Bet, TableLimits } from '../../types/betTypes';

/**
 * Default table limits when none specified
 */
const DEFAULT_TABLE_LIMITS: TableLimits = {
    minimumBet: 5,
    maximumBet: 500
};

/**
 * Enforces table limits on a bet amount
 */
const enforceTableLimits = (amount: number, tableLimits: TableLimits): number => {
    const min = tableLimits.minimumBet;
    const max = tableLimits.maximumBet;

    // Ensure bet is within table limits
    return Math.max(min, Math.min(amount, max));
};

/**
 * Flat betting strategy
 * Always bet the same amount regardless of previous outcomes
 */
export const flatStrategy: BettingStrategy = {
    type: 'flat',
    name: 'Flat Betting',
    description: 'Bet the same amount every hand regardless of outcome',
    risk: 'low',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        // Get the last bet amount or use minimum bet
        const lastBet = previousBets.length > 0 ? previousBets[previousBets.length - 1] : null;
        const baseBet = lastBet ? lastBet.amount : tableLimits.minimumBet;

        // Ensure bet is within bankroll and table limits
        return enforceTableLimits(Math.min(baseBet, bankroll), tableLimits);
    }
};

/**
 * Martingale betting strategy
 * Double bet after each loss, reset to base bet after a win
 */
export const martingaleStrategy: BettingStrategy = {
    type: 'martingale',
    name: 'Martingale',
    description: 'Double your bet after each loss, reset to base bet after a win',
    risk: 'high',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        // If no previous bets, use minimum bet
        if (previousBets.length === 0) {
            return enforceTableLimits(tableLimits.minimumBet, tableLimits);
        }

        // Get the last bet
        const lastBet = previousBets[previousBets.length - 1];
        if (!lastBet) {
            return enforceTableLimits(tableLimits.minimumBet, tableLimits);
        }

        const baseBet = tableLimits.minimumBet;

        // If last bet was a win or push, use base bet
        if (lastBet.status === 'won' || lastBet.status === 'push') {
            return enforceTableLimits(baseBet, tableLimits);
        }

        // If last bet was a loss, double the bet
        if (lastBet.status === 'lost') {
            const nextBet = lastBet.amount * 2;
            return enforceTableLimits(Math.min(nextBet, bankroll), tableLimits);
        }

        // Default to base bet for other cases
        return enforceTableLimits(Math.min(baseBet, bankroll), tableLimits);
    }
};

/**
 * Parlay betting strategy (Let it Ride)
 * Let winnings ride on next bet, reset after a loss
 */
export const parlayStrategy: BettingStrategy = {
    type: 'parlay',
    name: 'Parlay',
    description: 'Let your winnings ride on the next bet, reset after a loss',
    risk: 'medium',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        // If no previous bets, use minimum bet
        if (previousBets.length === 0) {
            return enforceTableLimits(tableLimits.minimumBet, tableLimits);
        }

        // Get the last bet
        const lastBet = previousBets[previousBets.length - 1];
        if (!lastBet) {
            return enforceTableLimits(tableLimits.minimumBet, tableLimits);
        }

        const baseBet = tableLimits.minimumBet;

        // If last bet was a win, let it ride (original bet + winnings)
        if (lastBet.status === 'won' && lastBet.payout) {
            const nextBet = lastBet.payout;
            return enforceTableLimits(Math.min(nextBet, bankroll), tableLimits);
        }

        // If last bet was a loss or other status, use base bet
        return enforceTableLimits(Math.min(baseBet, bankroll), tableLimits);
    }
};

/**
 * Fibonacci betting strategy
 * Follow Fibonacci sequence for losses, move back two steps after a win
 */
export const fibonacciStrategy: BettingStrategy = {
    type: 'fibonacci',
    name: 'Fibonacci',
    description: 'Follow Fibonacci sequence for losses, move back two steps after a win',
    risk: 'medium',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        const baseBet = tableLimits.minimumBet;

        // Generate Fibonacci sequence based on previous bets
        const sequence = [1, 1]; // Start with first two numbers of sequence

        // If no previous bets, use base bet
        if (previousBets.length === 0) {
            return enforceTableLimits(baseBet, tableLimits);
        }

        // Track position in sequence based on win/loss pattern
        let position = 0;

        // Analyze previous bets to determine position in sequence
        previousBets.forEach(bet => {
            if (bet.status === 'lost') {
                // Move forward in sequence after a loss
                position = Math.min(position + 1, sequence.length - 1);

                // Generate next Fibonacci number if needed
                if (position >= sequence.length - 1) {
                    const lastIndex = sequence.length - 1;
                    const secondLastIndex = sequence.length - 2;
                    if (lastIndex >= 0 && secondLastIndex >= 0) {
                        sequence.push((sequence[lastIndex] ?? 0) + (sequence[secondLastIndex] ?? 0));
                    }
                }
            } else if (bet.status === 'won') {
                // Move back two steps after a win
                position = Math.max(0, position - 2);
            }
            // Pushes/other results maintain current position
        });

        // Calculate next bet based on position in sequence
        const nextBet = baseBet * (sequence[position] ?? 1);

        return enforceTableLimits(Math.min(nextBet, bankroll), tableLimits);
    }
};

/**
 * D'Alembert betting strategy
 * Increase bet by one unit after a loss, decrease by one unit after a win
 */
export const dAlembertStrategy: BettingStrategy = {
    type: 'dAlembert',
    name: "D'Alembert",
    description: 'Increase bet by one unit after a loss, decrease by one unit after a win',
    risk: 'medium',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        const baseBet = tableLimits.minimumBet;

        // If no previous bets, use base bet
        if (previousBets.length === 0) {
            return enforceTableLimits(baseBet, tableLimits);
        }

        // Get the last bet
        const lastBet = previousBets[previousBets.length - 1];
        if (!lastBet) {
            return enforceTableLimits(baseBet, tableLimits);
        }

        let nextBet = lastBet.amount;

        // Adjust bet based on previous outcome
        if (lastBet.status === 'won') {
            // Decrease by one unit after a win
            nextBet = Math.max(baseBet, nextBet - baseBet);
        } else if (lastBet.status === 'lost') {
            // Increase by one unit after a loss
            nextBet = nextBet + baseBet;
        }

        return enforceTableLimits(Math.min(nextBet, bankroll), tableLimits);
    }
};

/**
 * Oscar's Grind betting strategy
 * Increase bet by one unit after a win, keep same bet after a loss
 * Goal is to win exactly one unit, then start over
 */
export const oscarsGrindStrategy: BettingStrategy = {
    type: 'oscarsGrind',
    name: "Oscar's Grind",
    description: 'Increase bet by one unit after a win, keep same bet after a loss',
    risk: 'low',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        const baseBet = tableLimits.minimumBet;

        // If no previous bets, use base bet
        if (previousBets.length === 0) {
            return enforceTableLimits(baseBet, tableLimits);
        }

        // Get the last bet
        const lastBet = previousBets[previousBets.length - 1];
        if (!lastBet) {
            return enforceTableLimits(baseBet, tableLimits);
        }

        // Find cycle start and calculate current profit
        const cycleStart = findCycleStart(previousBets, baseBet);
        const currentProfit = calculateCycleProfit(previousBets, cycleStart);

        // Determine next bet based on Oscar's Grind rules
        const nextBet = determineNextBet(lastBet, currentProfit, baseBet);

        return enforceTableLimits(Math.min(nextBet, bankroll), tableLimits);
    }
};

/**
 * Find the starting point of the current betting cycle
 */
const findCycleStart = (previousBets: Bet[], baseBet: number): number => {
    let currentProfit = 0;

    // Scan backwards to find where we last achieved +1 unit profit
    for (let i = previousBets.length - 1; i >= 0; i--) {
        const bet = previousBets[i];
        if (!bet) continue;

        if (bet.status === 'won') {
            currentProfit += (bet.payout ?? 0) - bet.amount;
        } else if (bet.status === 'lost') {
            currentProfit -= bet.amount;
        }

        // If we've reached +1 unit, mark this as cycle start
        if (currentProfit >= baseBet) {
            return i + 1;
        }
    }

    return 0; // If no cycle found, start from beginning
};

/**
 * Calculate profit in the current cycle
 */
const calculateCycleProfit = (previousBets: Bet[], cycleStart: number): number => {
    let profit = 0;

    for (let i = cycleStart; i < previousBets.length; i++) {
        const bet = previousBets[i];
        if (!bet) continue;

        if (bet.status === 'won') {
            profit += (bet.payout ?? 0) - bet.amount;
        } else if (bet.status === 'lost') {
            profit -= bet.amount;
        }
    }

    return profit;
};

/**
 * Determine the next bet based on Oscar's Grind rules
 */
const determineNextBet = (lastBet: Bet, currentProfit: number, baseBet: number): number => {
    // If we've achieved our target of +1 unit or more, reset to base bet
    if (currentProfit >= baseBet) {
        return baseBet;
    }

    // If last bet was a win and we haven't achieved our target, increase bet by one unit
    if (lastBet.status === 'won' && currentProfit < baseBet) {
        // Increase bet by one unit after a win, capped at 4 units
        return Math.min(lastBet.amount + baseBet, baseBet * 4);
    }

    // For loss or other cases, maintain the same bet amount
    return lastBet.amount;
};

/**
 * Labouchere (Cancellation) betting strategy
 * Use a sequence of numbers, betting the sum of first and last;
 * Remove numbers after a win, add the bet to the end after a loss
 */
export const labouchereStrategy: BettingStrategy = {
    type: 'labouchere',
    name: 'Labouchere',
    description: 'Use a sequence of numbers, betting the sum of first and last',
    risk: 'high',
    getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
        const baseBet = tableLimits.minimumBet;

        // Generate sequence based on previous bets
        const sequence = generateSequence(previousBets);

        // Calculate next bet amount based on sequence
        const nextBet = calculateBetFromSequence(sequence, baseBet);

        return enforceTableLimits(Math.min(nextBet, bankroll), tableLimits);
    }
};

/**
 * Generate Labouchere sequence based on previous bets
 */
const generateSequence = (previousBets: Bet[]): number[] => {
    // Default sequence
    const defaultSequence = [1, 2, 3, 4, 5, 6];

    // If no previous bets, use default sequence
    if (previousBets.length === 0) {
        return [...defaultSequence];
    }

    let sequence = [...defaultSequence];

    // Process each bet to update sequence
    for (const bet of previousBets) {
        // Reset sequence if it's too short
        if (sequence.length <= 1) {
            sequence = [...defaultSequence];
        }

        // Get current bet amount
        const firstNum = sequence[0] ?? 1;
        const lastNum = sequence.length >= 2 ? (sequence[sequence.length - 1] ?? 1) : firstNum;
        const betAmount = sequence.length >= 2 ? firstNum + lastNum : firstNum;

        // Update sequence based on bet outcome
        if (bet.status === 'won') {
            sequence = handleWin(sequence);
        } else if (bet.status === 'lost') {
            sequence = handleLoss(sequence, betAmount);
        }
    }

    return sequence;
};

/**
 * Handle sequence update after a win
 */
const handleWin = (sequence: number[]): number[] => {
    if (sequence.length >= 2) {
        // Remove first and last numbers
        const newSequence = [...sequence];
        newSequence.shift();
        newSequence.pop();
        return newSequence;
    }
    // Reset if only one number remains
    return [1, 2, 3, 4, 5, 6];
};

/**
 * Handle sequence update after a loss
 */
const handleLoss = (sequence: number[], betAmount: number): number[] => {
    // Add bet amount to end of sequence
    return [...sequence, betAmount];
};

/**
 * Calculate bet amount from sequence
 */
const calculateBetFromSequence = (sequence: number[], baseBet: number): number => {
    if (sequence.length >= 2) {
        // Bet is the sum of first and last numbers
        const firstNum = sequence[0] ?? 1;
        const lastNum = sequence[sequence.length - 1] ?? 1;
        return (firstNum + lastNum) * baseBet;
    }
    // If only one number or empty sequence
    return (sequence[0] ?? 1) * baseBet;
};

/**
 * All available betting strategies
 */
export const BETTING_STRATEGIES: Record<BettingStrategyType, BettingStrategy> = {
    flat: flatStrategy,
    martingale: martingaleStrategy,
    parlay: parlayStrategy,
    fibonacci: fibonacciStrategy,
    oscarsGrind: oscarsGrindStrategy,
    labouchere: labouchereStrategy,
    dAlembert: dAlembertStrategy,
    custom: {
        type: 'custom',
        name: 'Custom Strategy',
        description: 'User-defined custom betting strategy',
        risk: 'medium',
        getNextBet: (previousBets: Bet[], bankroll: number, tableLimits: TableLimits = DEFAULT_TABLE_LIMITS): number => {
            // Default implementation returns flat betting
            return flatStrategy.getNextBet(previousBets, bankroll, tableLimits);
        }
    }
};

/**
 * Get a betting strategy by type
 */
export const getBettingStrategy = (type: BettingStrategyType): BettingStrategy => {
    const strategy = BETTING_STRATEGIES[type];

    if (!strategy) {
        throw new Error(`Unknown betting strategy: ${type}`);
    }

    return strategy;
};

/**
 * Get all available betting strategies
 */
export const getAvailableStrategies = (): BettingStrategy[] => {
    return Object.values(BETTING_STRATEGIES);
};

const bettingStrategiesExport = {
    getBettingStrategy,
    getAvailableStrategies,
    enforceTableLimits,
    BETTING_STRATEGIES
};

export default bettingStrategiesExport;