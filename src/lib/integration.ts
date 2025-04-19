/**
 * Integration example demonstrating how to connect the event-based betting domain
 * with the application state management (Zustand).
 */

import { create } from 'zustand';
import { useBettingEventBus, BettingEventUnion } from './bettingEvents';
import {
    toAppBet,
    toBetOutcome
} from './bettingAdapter';
import { Bet as DomainBet } from './bettingTypes';
import { Bet, TableLimits } from '../../types/betTypes';

// -----------------------------------
// APPLICATION INTEGRATION EXAMPLE
// -----------------------------------

/**
 * Example of how to initialize the integration between
 * the domain events and application state
 */
export function initializeBettingDomainIntegration() {
    // This function would be called during application initialization
    const unsubscribe = subscribeToAllBettingEvents();

    // Return unsubscribe function to clean up when needed
    return unsubscribe;
}

/**
 * Subscribes to all betting events and updates application state accordingly
 */
export function subscribeToAllBettingEvents() {
    // Get the event bus
    const eventBus = useBettingEventBus.getState();

    // Subscribe to all events with a single handler
    return eventBus.subscribeToAll(handleBettingEvent);
}

/**
 * Central event handler for all betting domain events
 */
function handleBettingEvent(event: BettingEventUnion) {
    // Access our application state store
    const appState = useBettingAppStore.getState();

    // Route the event to the appropriate handler based on its type
    switch (event.type) {
        case 'BET_PLACED':
            appState.addBet(toAppBet(event.bet));
            break;

        case 'BET_UPDATED':
            appState.updateBet(
                `${event.bet.playerId}-${event.bet.timestamp}`,
                event.bet.amount
            );
            break;

        case 'BET_REMOVED':
            appState.removeBet(event.betId);
            break;

        case 'BET_SETTLED':
            appState.settleBet(
                event.betId,
                toBetOutcome(event.outcome),
                event.payout
            );
            break;

        case 'STRATEGY_APPLIED':
            appState.setCurrentBet(event.suggestedBet);
            break;

        case 'TABLE_LIMITS_CHANGED':
            appState.updateTableLimits({
                minimumBet: event.minBet,
                maximumBet: event.maxBet
            });
            break;

        default:
            console.warn('Unhandled betting event:', event);
    }
}

// -----------------------------------
// EXAMPLE APPLICATION STATE STORE
// -----------------------------------

/**
 * Simple example of an application betting state store
 */
interface BettingAppStore {
    // State
    bets: Bet[];
    currentBet: number;
    tableLimits: TableLimits;

    // Actions
    addBet: (bet: Bet) => void;
    updateBet: (betId: string, amount: number) => void;
    removeBet: (betId: string) => void;
    settleBet: (betId: string, outcome: string, payout: number) => void;
    setCurrentBet: (amount: number) => void;
    updateTableLimits: (limits: TableLimits) => void;
}

/**
 * Example implementation of the application store that would
 * receive updates from the domain events
 */
export const useBettingAppStore = create<BettingAppStore>((set) => ({
    bets: [],
    currentBet: 0,
    tableLimits: {
        minimumBet: 5,
        maximumBet: 1000
    },

    addBet: (bet) => set(state => ({
        bets: [...state.bets, bet]
    })),

    updateBet: (betId, amount) => set(state => ({
        bets: state.bets.map(bet =>
            bet.id === betId
                ? { ...bet, amount }
                : bet
        )
    })),

    removeBet: (betId) => set(state => ({
        bets: state.bets.filter(bet => bet.id !== betId)
    })),

    settleBet: (betId, outcome, payout) => set(state => ({
        bets: state.bets.map(bet =>
            bet.id === betId
                ? {
                    ...bet,
                    status: outcome as any,
                    payout
                }
                : bet
        )
    })),

    setCurrentBet: (amount) => set({
        currentBet: amount
    }),

    updateTableLimits: (limits) => set({
        tableLimits: limits
    })
}));

// -----------------------------------
// DOMAIN SERVICE EXAMPLE
// -----------------------------------

/**
 * Example domain service that demonstrates how to publish events
 */
export class BettingDomainService {
    private eventBus = useBettingEventBus.getState();

    /**
     * Places a new bet and publishes a BET_PLACED event
     */
    placeBet(bet: DomainBet): void {
        // Domain logic for validating and processing the bet would go here

        // Publish the event to the event bus
        this.eventBus.publish({
            type: 'BET_PLACED',
            timestamp: Date.now(),
            bet
        });
    }

    /**
     * Updates a bet and publishes a BET_UPDATED event
     */
    updateBet(bet: DomainBet, previousAmount: number): void {
        // Domain logic for validating and processing the bet update would go here

        // Publish the event to the event bus
        this.eventBus.publish({
            type: 'BET_UPDATED',
            timestamp: Date.now(),
            bet,
            previousAmount
        });
    }

    /**
     * Removes a bet and publishes a BET_REMOVED event
     */
    removeBet(betId: string): void {
        // Domain logic for removing the bet would go here

        // Publish the event to the event bus
        this.eventBus.publish({
            type: 'BET_REMOVED',
            timestamp: Date.now(),
            betId
        });
    }

    /**
     * Settles a bet with the given outcome and publishes a BET_SETTLED event
     */
    settleBet(betId: string, outcome: string, payout: number): void {
        // Domain logic for settling the bet would go here

        // Publish the event to the event bus
        this.eventBus.publish({
            type: 'BET_SETTLED',
            timestamp: Date.now(),
            betId,
            outcome: outcome as any,
            payout
        });
    }
}