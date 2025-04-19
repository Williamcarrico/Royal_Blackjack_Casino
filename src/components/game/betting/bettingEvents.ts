/**
 * Event-based communication system for the betting domain.
 * Facilitates loose coupling between domain logic and application state.
 */

import { create } from 'zustand';
import { Bet as DomainBet, BetOutcome } from './bettingTypes';

// ----------------------------
// EVENT TYPES
// ----------------------------

/**
 * All possible betting domain events
 */
export type BettingEventType =
    | 'BET_PLACED'
    | 'BET_UPDATED'
    | 'BET_REMOVED'
    | 'BET_SETTLED'
    | 'STRATEGY_APPLIED'
    | 'TABLE_LIMITS_CHANGED';

/**
 * Base event interface that all events extend
 */
export interface BettingEvent {
    type: BettingEventType;
    timestamp: number;
}

/**
 * Event fired when a bet is placed
 */
export interface BetPlacedEvent extends BettingEvent {
    type: 'BET_PLACED';
    bet: DomainBet;
}

/**
 * Event fired when a bet is updated
 */
export interface BetUpdatedEvent extends BettingEvent {
    type: 'BET_UPDATED';
    bet: DomainBet;
    previousAmount: number;
}

/**
 * Event fired when a bet is removed
 */
export interface BetRemovedEvent extends BettingEvent {
    type: 'BET_REMOVED';
    betId: string;
}

/**
 * Event fired when a bet is settled (won/lost)
 */
export interface BetSettledEvent extends BettingEvent {
    type: 'BET_SETTLED';
    betId: string;
    outcome: BetOutcome;
    payout: number;
}

/**
 * Event fired when a betting strategy is applied
 */
export interface StrategyAppliedEvent extends BettingEvent {
    type: 'STRATEGY_APPLIED';
    strategyType: string;
    suggestedBet: number;
}

/**
 * Event fired when table limits are changed
 */
export interface TableLimitsChangedEvent extends BettingEvent {
    type: 'TABLE_LIMITS_CHANGED';
    minBet: number;
    maxBet: number;
}

/**
 * Union type of all betting events
 */
export type BettingEventUnion =
    | BetPlacedEvent
    | BetUpdatedEvent
    | BetRemovedEvent
    | BetSettledEvent
    | StrategyAppliedEvent
    | TableLimitsChangedEvent;

// ----------------------------
// EVENT BUS IMPLEMENTATION
// ----------------------------

/**
 * Event handler type
 */
export type EventHandler = (event: BettingEventUnion) => void;

/**
 * Event bus store state
 */
interface EventBusState {
    /**
     * All registered event handlers
     */
    handlers: Map<BettingEventType, Set<EventHandler>>;

    /**
     * Register a handler for specific event types
     */
    subscribe: (eventType: BettingEventType, handler: EventHandler) => () => void;

    /**
     * Register a handler for all event types
     */
    subscribeToAll: (handler: EventHandler) => () => void;

    /**
     * Publish an event to all registered handlers
     */
    publish: (event: BettingEventUnion) => void;
}

/**
 * Creates and exports the event bus store
 */
export const useBettingEventBus = create<EventBusState>((set, get) => ({
    handlers: new Map(),

    subscribe: (eventType, handler) => {
        const { handlers } = get();

        // Initialize set if not exists
        if (!handlers.has(eventType)) {
            handlers.set(eventType, new Set());
        }

        // Add handler
        const eventHandlers = handlers.get(eventType);
        if (eventHandlers) {
            eventHandlers.add(handler);
        }

        // Return unsubscribe function
        return () => {
            const currentHandlers = get().handlers.get(eventType);
            if (currentHandlers) {
                currentHandlers.delete(handler);
            }
        };
    },

    subscribeToAll: (handler) => {
        // Subscribe to all event types
        const eventTypes: BettingEventType[] = [
            'BET_PLACED',
            'BET_UPDATED',
            'BET_REMOVED',
            'BET_SETTLED',
            'STRATEGY_APPLIED',
            'TABLE_LIMITS_CHANGED'
        ];

        // Create unsubscribe functions for each event type
        const unsubscribers = eventTypes.map(eventType =>
            get().subscribe(eventType, handler)
        );

        // Return combined unsubscribe function
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    },

    publish: (event) => {
        const { handlers } = get();

        // Get handlers for this event type
        const eventHandlers = handlers.get(event.type);

        // Call all registered handlers
        if (eventHandlers) {
            eventHandlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Error in event handler for ${event.type}:`, error);
                }
            });
        }
    }
}));

// ----------------------------
// EVENT CREATOR HELPERS
// ----------------------------

/**
 * Helper to create a bet placed event
 */
export const createBetPlacedEvent = (bet: DomainBet): BetPlacedEvent => ({
    type: 'BET_PLACED',
    timestamp: Date.now(),
    bet
});

/**
 * Helper to create a bet updated event
 */
export const createBetUpdatedEvent = (bet: DomainBet, previousAmount: number): BetUpdatedEvent => ({
    type: 'BET_UPDATED',
    timestamp: Date.now(),
    bet,
    previousAmount
});

/**
 * Helper to create a bet removed event
 */
export const createBetRemovedEvent = (betId: string): BetRemovedEvent => ({
    type: 'BET_REMOVED',
    timestamp: Date.now(),
    betId
});

/**
 * Helper to create a bet settled event
 */
export const createBetSettledEvent = (
    betId: string,
    outcome: BetOutcome,
    payout: number
): BetSettledEvent => ({
    type: 'BET_SETTLED',
    timestamp: Date.now(),
    betId,
    outcome,
    payout
});

/**
 * Helper to create a strategy applied event
 */
export const createStrategyAppliedEvent = (
    strategyType: string,
    suggestedBet: number
): StrategyAppliedEvent => ({
    type: 'STRATEGY_APPLIED',
    timestamp: Date.now(),
    strategyType,
    suggestedBet
});

/**
 * Helper to create a table limits changed event
 */
export const createTableLimitsChangedEvent = (
    minBet: number,
    maxBet: number
): TableLimitsChangedEvent => ({
    type: 'TABLE_LIMITS_CHANGED',
    timestamp: Date.now(),
    minBet,
    maxBet
});