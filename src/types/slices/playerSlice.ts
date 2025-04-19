'use client';

/**
 * Player slice for the blackjack game store
 */
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { PlayerSlice } from '../../types/storeTypes';
import { Player } from '../../types/gameTypes';

/**
 * Creates the player slice
 */
const createPlayerSlice: StateCreator<PlayerSlice> = (set, get) => ({
    players: [],
    activePlayerId: null,
    spectators: [],

    addPlayer: (name, balance) => {
        // Create new player
        const player: Player = {
            id: uuidv4(),
            name,
            balance,
            hands: [],
            currentBet: 0,
            totalBet: 0,
            winnings: 0,
            position: get().players.length, // Assign position based on current count
            isActive: false
        };

        // Add player to the store
        set(state => ({
            players: [...state.players, player]
        }));

        // If this is the first player, set as active
        if (get().players.length === 0) {
            set({ activePlayerId: player.id });
        }

        return player;
    },

    addSpectator: (name, balance) => {
        // Create new spectator
        const spectator: Player = {
            id: uuidv4(),
            name,
            balance,
            hands: [],
            currentBet: 0,
            totalBet: 0,
            winnings: 0,
            position: get().spectators.length,
            isActive: false
        };

        // Add spectator to the store
        set(state => ({
            spectators: [...state.spectators, spectator]
        }));

        return spectator;
    },

    removePlayer: (playerId) => {
        const { players, spectators, activePlayerId } = get();

        // Check if the player is in the active players list
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex !== -1) {
            // Remove player from players array
            const updatedPlayers = players.filter(p => p.id !== playerId);

            // Reassign positions if needed
            const playersWithUpdatedPositions = updatedPlayers.map((player, index) => ({
                ...player,
                position: index
            }));

            // Update active player ID if needed
            let newActivePlayerId = activePlayerId;

            if (activePlayerId === playerId) {
                // If the removed player was active, set the first remaining player as active
                newActivePlayerId = updatedPlayers.length > 0 ? updatedPlayers[0].id : null;
            }

            set({
                players: playersWithUpdatedPositions,
                activePlayerId: newActivePlayerId
            });
        } else {
            // Check if the player is in the spectators list
            const spectatorIndex = spectators.findIndex(s => s.id === playerId);

            if (spectatorIndex !== -1) {
                // Remove from spectators
                const updatedSpectators = spectators.filter(s => s.id !== playerId);

                // Reassign positions if needed
                const spectatorsWithUpdatedPositions = updatedSpectators.map((spectator, index) => ({
                    ...spectator,
                    position: index
                }));

                set({
                    spectators: spectatorsWithUpdatedPositions
                });
            } else {
                throw new Error(`Player with ID ${playerId} not found in players or spectators`);
            }
        }
    },

    updatePlayerBalance: (playerId, amount) => {
        const { players, spectators } = get();

        // Check if player is in active players list
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex !== -1) {
            const player = players[playerIndex];

            // Update player's balance
            const updatedPlayers = [...players];
            updatedPlayers[playerIndex] = {
                ...player,
                balance: player.balance + amount,
                winnings: amount > 0 ? player.winnings + amount : player.winnings
            };

            set({
                players: updatedPlayers
            });
        } else {
            // Check if player is in spectators list
            const spectatorIndex = spectators.findIndex(s => s.id === playerId);

            if (spectatorIndex !== -1) {
                const spectator = spectators[spectatorIndex];

                // Update spectator's balance
                const updatedSpectators = [...spectators];
                updatedSpectators[spectatorIndex] = {
                    ...spectator,
                    balance: spectator.balance + amount,
                    winnings: amount > 0 ? spectator.winnings + amount : spectator.winnings
                };

                set({
                    spectators: updatedSpectators
                });
            } else {
                throw new Error(`Player with ID ${playerId} not found in players or spectators`);
            }
        }
    },

    setActivePlayer: (playerId) => {
        const { players } = get();
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            throw new Error(`Player with ID ${playerId} not found in active players`);
        }

        set({ activePlayerId: playerId });
    },

    moveToSpectator: (playerId) => {
        const { players, activePlayerId } = get();
        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            throw new Error(`Player with ID ${playerId} not found in active players`);
        }

        const player = players[playerIndex];

        // Remove from players array
        const updatedPlayers = players.filter(p => p.id !== playerId);

        // Add to spectators array
        set(state => ({
            players: updatedPlayers,
            spectators: [...state.spectators, { ...player, isActive: false, position: state.spectators.length }],
            // If the active player is moved to spectator, update activePlayerId
            activePlayerId: activePlayerId === playerId
                ? (updatedPlayers.length > 0 ? updatedPlayers[0].id : null)
                : activePlayerId
        }));
    },

    moveToPlayers: (playerId) => {
        const { spectators } = get();
        const spectatorIndex = spectators.findIndex(s => s.id === playerId);

        if (spectatorIndex === -1) {
            throw new Error(`Player with ID ${playerId} not found in spectators`);
        }

        const spectator = spectators[spectatorIndex];

        // Remove from spectators array
        const updatedSpectators = spectators.filter(s => s.id !== playerId);

        // Add to players array
        set(state => {
            const position = state.players.length;

            return {
                spectators: updatedSpectators,
                players: [...state.players, { ...spectator, isActive: false, position }],
                // If there was no active player, make this the active player
                activePlayerId: state.activePlayerId ?? playerId
            };
        });
    },

    getCurrentPlayer: () => {
        const { players, activePlayerId } = get();

        if (!activePlayerId) {
            return null;
        }

        return players.find(p => p.id === activePlayerId) || null;
    },

    clearPlayers: () => {
        set({
            players: [],
            activePlayerId: null,
            spectators: []
        });
    }
});

export default createPlayerSlice;