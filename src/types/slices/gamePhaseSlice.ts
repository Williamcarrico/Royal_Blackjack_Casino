'use client';

import { createMachine, assign, interpret } from 'xstate';
import { useInterpret, useSelector } from '@xstate/react';
import { GamePhase } from '@/types/gameTypes';

/**
 * Reasons for phase transitions
 */
export type PhaseTransitionReason =
    | 'init'
    | 'bet_placed'
    | 'deal_complete'
    | 'player_action_complete'
    | 'dealer_turn_start'
    | 'settlement_complete'
    | 'round_reset'
    | 'game_over'
    | 'timeout'
    | 'manual_transition';

/**
 * Record of a phase transition with context data
 */
export interface PhaseTransition {
    from: GamePhase;
    to: GamePhase;
    timestamp: Date;
    reason: PhaseTransitionReason;
}

/** Explicit phase transition graph */
const validTransitions: Record<GamePhase, GamePhase[]> = {
    betting: ['dealing', 'cleanup'],
    dealing: ['playerTurn', 'dealerTurn', 'settlement'],
    playerTurn: ['dealerTurn', 'settlement'],
    dealerTurn: ['settlement'],
    settlement: ['betting', 'cleanup'],
    cleanup: ['betting'],
};

/** Context definition for FSM */
interface GamePhaseContext {
    phaseHistory: PhaseTransition[];
    phaseStartTime: number;
    phaseDuration: number;
    previousPhase: GamePhase | null;
    autoAdvance: boolean;
    autoAdvanceDelay: number;
}

/** Single event to transition between phases */
type GamePhaseEvent = {
    type: 'TRANSITION';
    phase: GamePhase;
    reason: PhaseTransitionReason;
};

/** XState machine for game phases */
export const gamePhaseMachine = createMachine<
    GamePhaseContext,
    GamePhaseEvent
>(
    {
        id: 'gamePhase',
        initial: 'betting',
        context: {
            phaseHistory: [],
            phaseStartTime: Date.now(),
            phaseDuration: 0,
            previousPhase: null,
            autoAdvance: false,
            autoAdvanceDelay: 2000,
        },
        states: (() => {
            const states: Record<string, any> = {};
            (Object.keys(validTransitions) as GamePhase[]).forEach((phase) => {
                states[phase] = {
                    on: {
                        TRANSITION: [
                            // Valid transitions
                            ...validTransitions[phase].map((toPhase) => ({
                                cond: (_ctx, event: GamePhaseEvent) => event.phase === toPhase,
                                target: toPhase,
                                actions: ['recordTransition', 'logTransition'],
                            })),
                            // Fallback for invalid transition
                            { actions: 'invalidTransition' },
                        ],
                    },
                };
            });
            return states;
        })(),
    },
    {
        actions: {
            recordTransition: assign((ctx, event, meta) => {
                const now = Date.now();
                const fromPhase = meta.state.value as GamePhase;
                const duration = now - ctx.phaseStartTime;
                const transition: PhaseTransition = {
                    from: fromPhase,
                    to: event.phase,
                    timestamp: new Date(now),
                    reason: event.reason,
                };
                return {
                    previousPhase: fromPhase,
                    phaseStartTime: now,
                    phaseDuration: duration,
                    phaseHistory: [...ctx.phaseHistory, transition],
                };
            }),
            logTransition: (_ctx, event, meta) => {
                const fromPhase = meta.state.value as GamePhase;
                console.info(`Phase transition: ${fromPhase} → ${event.phase} (${event.reason})`);
            },
            invalidTransition: (_ctx, event, meta) => {
                const fromPhase = meta.state.value as GamePhase;
                console.error(`Invalid phase transition: ${fromPhase} → ${event.phase}`);
            },
        },
    }
);

/**
 * Global service for the game phase machine, shared across store and UI
 */
export const gamePhaseService = interpret(gamePhaseMachine).start();

/**
 * React hook to consume the game phase FSM locally if needed.
 * Returns current phase, history, and a transition function.
 */
export function useGamePhaseMachine() {
    const service = useInterpret(gamePhaseMachine, { devTools: true });
    const state = useSelector(service, (state) => state);

    const currentPhase = state.value as GamePhase;
    const {
        previousPhase,
        phaseDuration,
        phaseHistory,
        autoAdvance,
        autoAdvanceDelay,
    } = state.context;

    /** Send a transition event */
    const transitionTo = (
        phase: GamePhase,
        reason: PhaseTransitionReason = 'manual_transition'
    ) => service.send({ type: 'TRANSITION', phase, reason });

    return {
        currentPhase,
        previousPhase,
        phaseDuration,
        phaseHistory,
        autoAdvance,
        autoAdvanceDelay,
        transitionTo,
        service,
    } as const;
}
