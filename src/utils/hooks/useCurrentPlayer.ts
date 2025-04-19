'use client';

import { useStore } from '@/store';
import { Player, GameState } from '@/types/gameTypes';

/**
 * Hook to easily access the current active player
 * @returns The current active player or null if no active player exists
 */
export function useCurrentPlayer(): Player | null {
    const { players, activePlayerId } = useStore((state: GameState) => ({
        players: state.players,
        activePlayerId: state.activePlayerIndex
    }));

    if (!activePlayerId) {
        return null;
    }

    return players.find((player: Player) => player.id === activePlayerId) || null;
}

export default useCurrentPlayer;