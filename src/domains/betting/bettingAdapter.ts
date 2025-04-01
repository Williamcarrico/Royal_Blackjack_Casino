// src/domains/betting/bettingAdapter.ts
// Purpose: Adapters to convert between domain-specific betting types and application-wide types

import {
    Bet as AppBet,
    BetStatus,
    BettingStrategy as AppBettingStrategy,
    BettingStrategyType,
    TableLimits
} from '../../types/betTypes';

import {
    Bet as DomainBet,
    BetOutcome,
    BettingStrategyContext,
    BettingStrategyFunction} from './bettingTypes';

/**
 * Converts an application-wide bet to a domain-specific bet
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
 * Converts a domain-specific bet to an application-wide bet
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
 * Creates a domain betting strategy function from an app betting strategy
 */
export const createDomainStrategyFunction = (
    appStrategy: AppBettingStrategy
): BettingStrategyFunction => {
    return (context: BettingStrategyContext): number => {
        // Convert from domain context to app context
        const { currentBalance, minBet, maxBet, previousBets = [] } = context;

        const appPreviousBets = previousBets.map(toAppBet);

        const tableLimits: TableLimits = {
            minimumBet: minBet,
            maximumBet: maxBet
        };

        // Call the app strategy's getNextBet function
        return appStrategy.getNextBet(
            appPreviousBets,
            currentBalance,
            tableLimits
        );
    };
};

/**
 * Converts a BetStatus to a BetOutcome
 */
export const toBetOutcome = (status: BetStatus): BetOutcome => {
    switch (status) {
        case 'won':
            return BetOutcome.WIN;
        case 'lost':
            return BetOutcome.LOSE;
        case 'push':
            return BetOutcome.PUSH;
        case 'surrendered':
            return BetOutcome.SURRENDER;
        default:
            return BetOutcome.LOSE; // Default to LOSE for unhandled statuses
    }
};

/**
 * Gets the appropriate configuration type for a given strategy type
 */
export const getConfigType = (
    strategyType: BettingStrategyType
): string => {
    switch (strategyType) {
        case 'flat':
            return 'betAmount';
        case 'martingale':
            return 'baseBet';
        case 'fibonacci':
            return 'baseBet';
        case 'dAlembert':
            return 'baseBet';
        case 'oscarsGrind':
            return 'baseBet';
        case 'parlay':
            return 'baseBet';
        default:
            return 'baseBet'; // Default to baseBet for unknown strategies
    }
};

/**
 * Builds a betting strategy context from the given parameters
 */
export const buildStrategyContext = (
    currentBalance: number,
    tableLimits: TableLimits,
    previousBets: AppBet[] = []
): BettingStrategyContext => {
    const domainBets = previousBets.map(toDomainBet);

    let lastBet;
    if (previousBets.length > 0) {
        const lastAppBet = previousBets[previousBets.length - 1];
        if (lastAppBet) {
            lastBet = {
                amount: lastAppBet.amount,
                outcome: toBetOutcome(lastAppBet.status),
                payout: lastAppBet.payout
            };
        }
    }

    return {
        currentBalance,
        minBet: tableLimits.minimumBet,
        maxBet: tableLimits.maximumBet,
        previousBets: domainBets,
        lastBet
    };
};