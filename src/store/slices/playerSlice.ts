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
    activePlayerIndex: -1,

    addPlayer: (name, balance) => {
        const { players } = get();

        // Create new player
        const player: Player = {
            id: uuidv4(),
            name,
            balance,
            hands: [],
            currentBet: 0,
            totalBet: 0,
            winnings: 0,
            position: players.length, // Assign position based on current count
            isActive: false
        };

        // Add player to the store
        set(state => ({
            players: [...state.players, player]
        }));

        // If this is the first player, set as active
        if (players.length === 0) {
            set({ activePlayerIndex: 0 });

            // Set player as active
            const updatedPlayers = [...players, player];
            updatedPlayers[0] = { ...updatedPlayers[0], isActive: true };
            set({ players: updatedPlayers });
        }

        return player;
    },

    removePlayer: (playerId) => {
        set(state => {
            const playerIndex = state.players.findIndex(p => p.id === playerId);

            if (playerIndex === -1) {
                throw new Error(`Player with ID ${playerId} not found`);
            }

            // Remove player
            const updatedPlayers = state.players.filter(p => p.id !== playerId);

            // Reassign positions if needed
            const playersWithUpdatedPositions = updatedPlayers.map((player, index) => ({
                ...player,
                position: index
            }));

            // Adjust active player index if needed
            let activePlayerIndex = state.activePlayerIndex;

            if (playerIndex === state.activePlayerIndex) {
                // If the removed player was active, set the next player as active
                activePlayerIndex = playerIndex < updatedPlayers.length ? playerIndex : 0;
            } else if (playerIndex < state.activePlayerIndex) {
                // If the removed player was before the active player, decrement the index
                activePlayerIndex--;
            }

            // Set active flag on the appropriate player
            const finalPlayers = playersWithUpdatedPositions.map((player, index) => ({
                ...player,
                isActive: index === activePlayerIndex
            }));

            return {
                players: finalPlayers,
                activePlayerIndex: updatedPlayers.length > 0 ? activePlayerIndex : -1
            };
        });
    },

    updatePlayerBalance: (playerId, amount) => {
        set(state => {
            const playerIndex = state.players.findIndex(p => p.id === playerId);

            if (playerIndex === -1) {
                throw new Error(`Player with ID ${playerId} not found`);
            }

            const player = state.players[playerIndex];

            // Update player's balance
            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...player,
                balance: player.balance + amount,
                winnings: amount > 0 ? player.winnings + amount : player.winnings
            };

            return {
                players: updatedPlayers
            };
        });
    },

    setActivePlayer: (index) => {
        set(state => {
            if (index < 0 || index >= state.players.length) {
                throw new Error(`Invalid player index: ${index}`);
            }

            // Create new players array with updated active status
            const updatedPlayers = state.players.map((player, i) => ({
                ...player,
                isActive: i === index
            }));

            return {
                players: updatedPlayers,
                activePlayerIndex: index
            };
        });
    },

    clearPlayers: () => {
        set({
            players: [],
            activePlayerIndex: -1
        });
    }
});

export default createPlayerSlice;