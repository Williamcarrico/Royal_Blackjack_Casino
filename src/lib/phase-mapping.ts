import type { GamePhase, UIGamePhase } from '@/types/gameTypes';

/**
 * Mapping from GamePhase (store) to UIGamePhase (UI)
 */
export const phaseToUIMap: Record<GamePhase, UIGamePhase> = {
    [UIGamePhase.Betting]: UIGamePhase.Betting,
    [UIGamePhase.Dealing]: UIGamePhase.Dealing,
    [UIGamePhase.PlayerTurn]: UIGamePhase.PlayerTurn,
    [UIGamePhase.DealerTurn]: UIGamePhase.DealerTurn,
    [UIGamePhase.Settlement]: UIGamePhase.Settlement,
    [UIGamePhase.Cleanup]: UIGamePhase.Cleanup,
    [UIGamePhase.Completed]: UIGamePhase.Completed,
};

/**
 * Mapping from UIGamePhase (UI) back to GamePhase (store)
 */
export const uiToPhaseMap: Record<UIGamePhase, GamePhase> = {
    [UIGamePhase.Betting]: UIGamePhase.Betting,
    [UIGamePhase.Dealing]: UIGamePhase.Dealing,
    [UIGamePhase.PlayerTurn]: UIGamePhase.PlayerTurn,
    [UIGamePhase.DealerTurn]: UIGamePhase.DealerTurn,
    [UIGamePhase.Settlement]: UIGamePhase.Settlement,
    [UIGamePhase.Cleanup]: UIGamePhase.Cleanup,
    [UIGamePhase.Completed]: UIGamePhase.Completed,
};

/**
 * Convert store phase to UI phase label
 */
export function toUIPhase(phase: GamePhase): UIGamePhase {
    return phaseToUIMap[phase] ?? UIGamePhase.Betting;
}

/**
 * Convert UI phase to store phase for transitions
 */
export function toStorePhase(uiPhase: UIGamePhase): GamePhase {
    return uiToPhaseMap[uiPhase] ?? UIGamePhase.Betting;
}

/**
 * UI messages for each phase
 */
export const uiPhaseMessageMap: Record<UIGamePhase, string> = {
    [UIGamePhase.Betting]: 'Place your bet to begin',
    [UIGamePhase.Dealing]: 'Dealing cards...',
    [UIGamePhase.PlayerTurn]: 'Make your decision',
    [UIGamePhase.DealerTurn]: "Dealer's turn",
    [UIGamePhase.Settlement]: 'Round complete',
    [UIGamePhase.Cleanup]: 'Game over',
    [UIGamePhase.Completed]: 'Game over',
};

/**
 * Get the message for the current UI phase
 */
export function getUIPhaseMessage(uiPhase: UIGamePhase): string {
    return uiPhaseMessageMap[uiPhase] ?? '';
}