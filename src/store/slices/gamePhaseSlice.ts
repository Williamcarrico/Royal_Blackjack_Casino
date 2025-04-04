'use client';

/**
 * Game Phase Slice
 *
 * Controls the flow and transitions between different game phases.
 * Manages the current phase, phase history, and provides actions for phase transitions.
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GamePhase } from '@/types/gameTypes';

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

export type PhaseTransition = {
    from: GamePhase;
    to: GamePhase;
    timestamp: Date;
    reason: PhaseTransitionReason;
};

interface GamePhaseState {
    // State
    currentPhase: GamePhase;
    previousPhase: GamePhase | null;
    phaseHistory: PhaseTransition[];
    phaseStartTime: Date;
    phaseDuration: number; // in milliseconds
    isTransitioning: boolean;
    autoAdvance: boolean;
    autoAdvanceDelay: number; // in milliseconds
    availableTransitions: GamePhase[];

    // Actions
    transitionTo: (phase: GamePhase, reason: PhaseTransitionReason) => void;
    setAutoAdvance: (enable: boolean, delay?: number) => void;
    resetPhaseHistory: () => void;
    getPhaseDuration: () => number;
    canTransitionTo: (phase: GamePhase) => boolean;
    goToPreviousPhase: () => void;
    getPhaseHistory: () => PhaseTransition[];
}

// Define valid phase transitions
const validTransitions: Record<GamePhase, GamePhase[]> = {
    'betting': ['dealing', 'cleanup'],
    'dealing': ['playerTurn', 'dealerTurn', 'settlement'],
    'playerTurn': ['dealerTurn', 'settlement'],
    'dealerTurn': ['settlement'],
    'settlement': ['betting', 'cleanup'],
    'cleanup': ['betting'],
};

// Create a function that returns the slice for integration with the main store
export const createGamePhaseSlice = (
    set: (state: Partial<GamePhaseState> | ((state: GamePhaseState) => Partial<GamePhaseState>)) => void,
    get: () => GamePhaseState
) => ({
    // Initial state
    currentPhase: 'betting' as GamePhase,
    previousPhase: null,
    phaseHistory: [],
    phaseStartTime: new Date(),
    phaseDuration: 0,
    isTransitioning: false,
    autoAdvance: false,
    autoAdvanceDelay: 2000, // Default 2 seconds
    availableTransitions: validTransitions['betting'],

    // Transition to a new game phase
    transitionTo: (phase: GamePhase, reason: PhaseTransitionReason = 'manual_transition') => {
        const { currentPhase, phaseStartTime } = get();

        // Validate the transition
        if (!validTransitions[currentPhase].includes(phase)) {
            console.error(`Invalid phase transition: ${currentPhase} -> ${phase}`);
            return;
        }

        const now = new Date();
        const phaseDuration = now.getTime() - phaseStartTime.getTime();

        // Create transition record
        const transition: PhaseTransition = {
            from: currentPhase,
            to: phase,
            timestamp: now,
            reason,
        };

        // Update state
        set({
            previousPhase: currentPhase,
            currentPhase: phase,
            phaseStartTime: now,
            phaseDuration,
            phaseHistory: [...get().phaseHistory, transition],
            isTransitioning: true,
            availableTransitions: validTransitions[phase]
        });

        // Complete transition after a short delay
        setTimeout(() => {
            set({ isTransitioning: false });

            // Auto-advance if enabled
            if (get().autoAdvance) {
                const nextPhases = validTransitions[phase];
                if (nextPhases.length === 1) {
                    setTimeout(() => {
                        // Use non-null assertion since we checked length === 1
                        get().transitionTo(nextPhases[0]!, 'timeout');
                    }, get().autoAdvanceDelay);
                }
            }
        }, 100);
    },

    // Set auto-advance configuration
    setAutoAdvance: (enable: boolean, delay?: number) => {
        set({
            autoAdvance: enable,
            autoAdvanceDelay: delay || get().autoAdvanceDelay
        });
    },

    // Reset phase history
    resetPhaseHistory: () => {
        set({
            phaseHistory: [],
            currentPhase: 'betting',
            previousPhase: null,
            phaseStartTime: new Date(),
            availableTransitions: validTransitions['betting']
        });
    },

    // Get current phase duration
    getPhaseDuration: () => {
        const { phaseStartTime } = get();
        return new Date().getTime() - phaseStartTime.getTime();
    },

    // Check if a transition is valid
    canTransitionTo: (phase: GamePhase) => {
        return validTransitions[get().currentPhase].includes(phase);
    },

    // Go back to the previous phase if possible
    goToPreviousPhase: () => {
        const { previousPhase } = get();
        if (previousPhase && validTransitions[previousPhase].includes(get().currentPhase)) {
            get().transitionTo(previousPhase, 'manual_transition');
        }
    },

    // Get phase history
    getPhaseHistory: () => {
        return get().phaseHistory;
    }
});

export const useGamePhaseStore = create<GamePhaseState>()(
    devtools(
        (set, get) => createGamePhaseSlice(set, get)
    )
);

// Custom hooks for common operations
export const useGamePhase = () => {
    const { currentPhase, transitionTo, canTransitionTo } = useGamePhaseStore();
    return { currentPhase, transitionTo, canTransitionTo };
};

export const usePhaseTransitions = () => {
    const { availableTransitions, transitionTo } = useGamePhaseStore();
    return { availableTransitions, transitionTo };
};