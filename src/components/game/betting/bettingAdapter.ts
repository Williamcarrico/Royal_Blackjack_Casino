// src/domains/betting/bettingAdapter.ts
// Purpose: Pure transformation adapter between domain-specific betting types and application-wide types.
// This file contains stateless utility functions to convert between different data representations
// without introducing side effects.

import {
    Bet as AppBet,
    BetStatus,
    BetOutcomeStatus,
    BettingStrategy as AppBettingStrategy,
    TableLimits
} from '../../types/betTypes';

import {
    Bet as DomainBet,
    BetOutcome,
    BettingStrategyContext,
    BettingStrategyFunction
} from './bettingTypes';

import { StrategyConfig } from '../../lib/strategies';

/**
 * Converts an application-wide bet to a domain-specific bet.
 * Pure transformation function with no side effects.
 *
 * @param appBet The application bet format
 * @returns The domain-specific bet format
 */
export const toDomainBet = (appBet: AppBet): DomainBet => {
    return {
        playerId: appBet.handId.split('-')[0] ?? '', // Extract player ID from hand ID if possible
        amount: appBet.amount,
        handId: appBet.handId,
        timestamp: appBet.timestamp.getTime(),
        status: appBet.status,
        payout: appBet.payout,
        payoutMultiplier: appBet.payoutMultiplier,
        type: 'main' // Default to main bet type
    };
};

/**
 * Converts a domain-specific bet to an application-wide bet.
 * Pure transformation function with no side effects.
 *
 * @param domainBet The domain-specific bet format
 * @returns The application bet format
 */
export const toAppBet = (domainBet: DomainBet): AppBet => {
    return {
        id: `${domainBet.playerId}-${domainBet.timestamp}`,
        amount: domainBet.amount,
        status: domainBet.status ?? 'pending',
        handId: domainBet.handId ?? `${domainBet.playerId}-${domainBet.timestamp}`,
        timestamp: new Date(domainBet.timestamp),
        payout: domainBet.payout,
        payoutMultiplier: domainBet.payoutMultiplier
    };
};

/**
 * Creates a domain betting strategy function from an app betting strategy.
 * Adapts the application strategy interface to work with domain-specific context.
 *
 * @param appStrategy The application betting strategy
 * @returns A strategy function compatible with domain betting logic
 */
export const createDomainStrategyFunction = (
    appStrategy: AppBettingStrategy
): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        // Convert from domain context to app context
        const appPreviousBets = (context.previousBets ?? []).map(toAppBet);
        const tableLimits = toAppTableLimits(context);

        // Call the app strategy's getNextBet function
        return appStrategy.getNextBet(
            appPreviousBets,
            context.currentBalance,
            tableLimits
        );
    };
};

/**
 * Transforms domain strategy context to application table limits.
 * Pure mapping function.
 *
 * @param context Domain betting strategy context
 * @returns Application table limits
 */
export const toAppTableLimits = (context: BettingStrategyContext): TableLimits => {
    return {
        minimumBet: context.minBet,
        maximumBet: context.maxBet
    };
};

/**
 * Maps between BetStatus and BetOutcome.
 * Pure mapping function.
 *
 * @param status The application bet status
 * @returns The corresponding domain-specific bet outcome
 */
export const toBetOutcome = (status: BetStatus): BetOutcome => {
    const outcomeMap: Record<BetStatus, BetOutcome> = {
        'won': BetOutcome.WIN,
        'lost': BetOutcome.LOSE,
        'push': BetOutcome.PUSH,
        'surrendered': BetOutcome.SURRENDER,
        'pending': BetOutcome.LOSE,
        'active': BetOutcome.LOSE,
        'cancelled': BetOutcome.LOSE
    };

    return outcomeMap[status];
};

/**
 * Maps from domain bet outcome to application bet status.
 * Pure mapping function.
 *
 * @param outcome The domain-specific bet outcome
 * @returns The corresponding application bet status
 */
export const toAppBetStatus = (outcome: BetOutcome): BetStatus => {
    const statusMap: Record<BetOutcome, BetStatus> = {
        [BetOutcome.WIN]: BetOutcomeStatus.WIN,
        [BetOutcome.LOSE]: BetOutcomeStatus.LOSE,
        [BetOutcome.PUSH]: BetOutcomeStatus.PUSH,
        [BetOutcome.SURRENDER]: BetOutcomeStatus.SURRENDER,
        [BetOutcome.BLACKJACK]: BetOutcomeStatus.WIN
    };

    return statusMap[outcome];
};

/**
 * Maps between strategy configuration and property name.
 * Pure mapping function.
 *
 * @param config Strategy configuration
 * @returns The primary configuration property name
 */
export const getPrimaryConfigProperty = (config: StrategyConfig): string => {
    const propertyMap: Record<string, string> = {
        'flat': 'betAmount',
        'martingale': 'baseBet',
        'fibonacci': 'baseBet',
        'dAlembert': 'baseBet',
        'd_alembert': 'baseBet',
        'oscarsGrind': 'baseBet',
        'oscar': 'baseBet',
        'parlay': 'baseBet'
    };

    return propertyMap[config.type] || 'baseBet';
};

/**
 * Builds a betting strategy context from application parameters.
 * Transforms application-level data into the format expected by domain strategies.
 *
 * @param currentBalance The player's current balance
 * @param tableLimits The table betting limits
 * @param previousBets Previous bets in application format
 * @returns A properly formatted betting strategy context for domain use
 */
export const buildStrategyContext = (
    currentBalance: number,
    tableLimits: TableLimits,
    previousBets: AppBet[] = []
): BettingStrategyContext => {
    const domainBets = previousBets.map(toDomainBet);

    // Extract last bet information if available
    const lastBet = previousBets.length > 0
        ? {
            amount: previousBets[previousBets.length - 1].amount,
            outcome: toBetOutcome(previousBets[previousBets.length - 1].status),
            payout: previousBets[previousBets.length - 1].payout
        }
        : undefined;

    return {
        currentBalance,
        minBet: tableLimits.minimumBet,
        maxBet: tableLimits.maximumBet,
        previousBets: domainBets,
        lastBet
    };
};