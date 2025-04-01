/**
 * Hook for managing Blackjack players
 */
import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import createPlayerSlice from '../../store/slices/playerSlice';
import {
    Player,
    PlayerPosition,
    PlayerStatus,
    PlayerType
} from '../../types/playerTypes';

// Player slice store
const usePlayerStore = create(createPlayerSlice);

// Maximum number of players allowed at the table
const MAX_PLAYERS = 7;

/**
 * Hook for managing Blackjack players
 */
export function usePlayer() {
    const {
        players,
        activePlayerIndex,
        addPlayer,
        removePlayer,
        updatePlayerBalance,
        setActivePlayer,
        clearPlayers
    } = usePlayerStore();

    /**
     * Get the currently active player
     */
    const activePlayer = useMemo((): Player | null => {
        if (activePlayerIndex >= 0 && activePlayerIndex < players.length) {
            return players[activePlayerIndex];
        }
        return null;
    }, [players, activePlayerIndex]);

    /**
     * Check if the table is full
     */
    const isTableFull = useMemo((): boolean => {
        return players.length >= MAX_PLAYERS;
    }, [players]);

    /**
     * Add a new player to the table
     */
    const addNewPlayer = useCallback((
        name: string,
        balance: number = 1000,
        type: PlayerType = 'human',
        avatarUrl?: string
    ): Player | null => {
        if (isTableFull) {
            return null;
        }

        // Determine next available position
        const usedPositions = players.map(p => p.position);
        const availablePositions: PlayerPosition[] = [0, 1, 2, 3, 4, 5, 6].filter(
            pos => !usedPositions.includes(pos as PlayerPosition)
        ) as PlayerPosition[];

        const position = availablePositions[0] || 0;

        // Create player
        const player: Player = {
            id: uuidv4(),
            name,
            balance,
            type,
            position,
            status: 'active',
            handsPlayed: 0,
            handsWon: 0,
            totalWagered: 0,
            totalWinnings: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            longestLossStreak: 0,
            avatarUrl
        };

        addPlayer(player);

        return player;
    }, [players, isTableFull, addPlayer]);

    /**
     * Remove a player from the table
     */
    const removePlayerById = useCallback((id: string): boolean => {
        const playerIndex = players.findIndex(p => p.id === id);

        if (playerIndex === -1) {
            return false;
        }

        removePlayer(id);
        return true;
    }, [players, removePlayer]);

    /**
     * Update a player's balance (add or subtract funds)
     */
    const updateBalance = useCallback((
        playerId: string,
        amount: number
    ): boolean => {
        const player = players.find(p => p.id === playerId);

        if (!player) {
            return false;
        }

        // Don't allow negative balance
        if (player.balance + amount < 0) {
            return false;
        }

        // Update player balance
        updatePlayerBalance(playerId, amount);

        return true;
    }, [players, updatePlayerBalance]);

    /**
     * Set a player's status
     */
    const setPlayerStatus = useCallback((
        playerId: string,
        status: PlayerStatus
    ): boolean => {
        const player = players.find(p => p.id === playerId);

        if (!player) {
            return false;
        }

        // Update player
        const updatedPlayer = {
            ...player,
            status
        };

        // Currently, there's no direct method to update player status in the store
        // So we need to use a workaround by removing and re-adding the player
        removePlayer(playerId);
        addPlayer(updatedPlayer);

        return true;
    }, [players, removePlayer, addPlayer]);

    /**
     * Add chips to a player's balance
     */
    const buyChips = useCallback((
        playerId: string,
        amount: number
    ): boolean => {
        if (amount <= 0) {
            return false;
        }

        return updateBalance(playerId, amount);
    }, [updateBalance]);

    /**
     * Remove chips from a player's balance (cash out)
     */
    const cashOut = useCallback((
        playerId: string,
        amount: number
    ): boolean => {
        const player = players.find(p => p.id === playerId);

        if (!player) {
            return false;
        }

        // Don't allow cashing out more than the player has
        const cashOutAmount = Math.min(amount, player.balance);

        if (cashOutAmount <= 0) {
            return false;
        }

        return updateBalance(playerId, -cashOutAmount);
    }, [players, updateBalance]);

    /**
     * Cash out all chips (remove all balance)
     */
    const cashOutAll = useCallback((
        playerId: string
    ): number => {
        const player = players.find(p => p.id === playerId);

        if (!player || player.balance <= 0) {
            return 0;
        }

        const amount = player.balance;
        updateBalance(playerId, -amount);

        return amount;
    }, [players, updateBalance]);

    /**
     * Record a hand result for a player
     */
    const recordHandResult = useCallback((
        playerId: string,
        didWin: boolean,
        wagered: number,
        winnings: number
    ): void => {
        const player = players.find(p => p.id === playerId);

        if (!player) {
            return;
        }

        // Update stats
        const handsPlayed = player.handsPlayed + 1;
        const handsWon = didWin ? player.handsWon + 1 : player.handsWon;
        const totalWagered = player.totalWagered + wagered;
        const totalWinnings = player.totalWinnings + winnings;

        // Update streak
        let currentStreak = player.currentStreak;
        let longestWinStreak = player.longestWinStreak;
        let longestLossStreak = player.longestLossStreak;

        if (didWin) {
            // Win - increment streak if positive, reset if negative
            currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;

            // Update longest win streak if needed
            longestWinStreak = Math.max(longestWinStreak, currentStreak);
        } else {
            // Loss - decrement streak if negative, reset if positive
            currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;

            // Update longest loss streak if needed
            longestLossStreak = Math.max(longestLossStreak, Math.abs(currentStreak));
        }

        // Create updated player object
        const updatedPlayer = {
            ...player,
            handsPlayed,
            handsWon,
            totalWagered,
            totalWinnings,
            currentStreak,
            longestWinStreak,
            longestLossStreak
        };

        // Currently, there's no direct method to update player stats in the store
        // So we need to use a workaround by removing and re-adding the player
        removePlayer(playerId);
        addPlayer(updatedPlayer);
    }, [players, removePlayer, addPlayer]);

    /**
     * Move a player to a different position at the table
     */
    const movePlayer = useCallback((
        playerId: string,
        newPosition: PlayerPosition
    ): boolean => {
        // Check if position is already taken
        const isPositionTaken = players.some(p => p.position === newPosition);

        if (isPositionTaken) {
            return false;
        }

        const player = players.find(p => p.id === playerId);

        if (!player) {
            return false;
        }

        // Create updated player object
        const updatedPlayer = {
            ...player,
            position: newPosition
        };

        // Currently, there's no direct method to update player position in the store
        // So we need to use a workaround by removing and re-adding the player
        removePlayer(playerId);
        addPlayer(updatedPlayer);

        return true;
    }, [players, removePlayer, addPlayer]);

    /**
     * Set a specific player as active
     */
    const activatePlayer = useCallback((playerId: string): boolean => {
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            return false;
        }

        setActivePlayer(playerIndex);
        return true;
    }, [players, setActivePlayer]);

    /**
     * Move to the next player
     */
    const nextPlayer = useCallback((): Player | null => {
        if (players.length === 0) {
            return null;
        }

        // Find next active player
        let nextIndex = (activePlayerIndex + 1) % players.length;
        let attempts = 0;

        // Cycle through players until we find an active one or have checked all players
        while (attempts < players.length) {
            const player = players[nextIndex];

            if (player.status === 'active') {
                setActivePlayer(nextIndex);
                return player;
            }

            nextIndex = (nextIndex + 1) % players.length;
            attempts++;
        }

        // If no active players found, return null
        return null;
    }, [players, activePlayerIndex, setActivePlayer]);

    /**
     * Get player statistics
     */
    const getPlayerStats = useCallback((playerId: string) => {
        const player = players.find(p => p.id === playerId);

        if (!player) {
            return null;
        }

        const winRate = player.handsPlayed > 0
            ? (player.handsWon / player.handsPlayed) * 100
            : 0;

        const netProfit = player.totalWinnings - player.totalWagered;

        const roi = player.totalWagered > 0
            ? (netProfit / player.totalWagered) * 100
            : 0;

        return {
            handsPlayed: player.handsPlayed,
            handsWon: player.handsWon,
            winRate,
            totalWagered: player.totalWagered,
            totalWinnings: player.totalWinnings,
            netProfit,
            roi,
            currentStreak: player.currentStreak,
            longestWinStreak: player.longestWinStreak,
            longestLossStreak: player.longestLossStreak
        };
    }, [players]);

    /**
     * Reset all players (clear the table)
     */
    const resetPlayers = useCallback((): void => {
        clearPlayers();
    }, [clearPlayers]);

    return {
        // State
        players,
        activePlayer,
        activePlayerIndex,
        isTableFull,

        // Player management
        addNewPlayer,
        removePlayerById,
        updateBalance,
        setPlayerStatus,
        buyChips,
        cashOut,
        cashOutAll,
        movePlayer,

        // Player selection
        activatePlayer,
        nextPlayer,

        // Statistics
        recordHandResult,
        getPlayerStats,

        // Table management
        resetPlayers
    };
}

export default usePlayer;