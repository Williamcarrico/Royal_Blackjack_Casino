import { useEffect } from 'react';
import { toast } from 'sonner';
import { GameStore } from '@/types/storeTypes';
import { SideBetType } from '@/types/betTypes';
import { DEFAULT_STARTING_CHIPS } from '@/lib/constants/gameConstants';
import { useGameState } from '@/hooks/game/useGameState';

// Define a type for the audio elements used in the game
interface AudioElement extends HTMLAudioElement {
  pause: () => void;
  currentTime: number;
}

// Create the ambientSounds object since it cannot be found in the codebase
const ambientSounds: Record<string, AudioElement> = {};

// Define PlayerSpot type as it's not exported from gameTypes
interface PlayerSpot {
  id: string;
  position: number;
  isOccupied: boolean;
  playerId?: string;
}

export const useGameInitialization = (
  gameStore: GameStore,
  analytics: {
    startSession: (initialBalance: number) => void;
    endSession: (finalBalance: number) => void;
  },
  setIsLoading: (isLoading: boolean) => void,
  // We'll keep setPlayers in the params but use it for player initialization
  setPlayers: (players: PlayerSpot[]) => void
) => {
  // Get GameState hook
  const gameState = useGameState();

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      // Make sure we have a player with proper starting balance in gameStore
      if (!gameStore.gameState?.players?.length) {
        // Add player before initializing game with proper balance
        if (gameStore.addPlayer) {
          gameStore.addPlayer('Player', DEFAULT_STARTING_CHIPS);
          console.log(`Added player to gameStore with starting balance: ${DEFAULT_STARTING_CHIPS}`);
        }
      }

      // Also add player to gameState
      if (gameState.addPlayer) {
        const playerId = gameState.addPlayer('Player', DEFAULT_STARTING_CHIPS);
        console.log(`Added player to gameState with ID: ${playerId} and balance: ${DEFAULT_STARTING_CHIPS}`);
      }

      // Start analytics session with initial balance
      const initialBalance = gameStore.gameState?.players[0]?.balance || DEFAULT_STARTING_CHIPS;
      analytics.startSession(initialBalance);

      // Initialize game if not already initialized
      if (!gameStore.gameState?.id) {
        gameStore.initializeGame({
          variant: 'classic',
          numberOfDecks: 6,
          dealerHitsSoft17: true,
          blackjackPays: 1.5,
          doubleAfterSplit: true,
          resplitAces: false,
          lateSurrender: true,
          maxSplitHands: 4,
          penetration: 0.75,
          tableLimits: {
            minimumBet: 5,
            maximumBet: 500,
            minimumSideBet: 1,
            maximumSideBet: 100
          },
          payoutRules: {
            blackjack: 1.5,
            insurance: 2,
            surrender: 0.5,
            regularWin: 1,
            sideBets: {} as Record<SideBetType, number | Record<string, number>>
          },
          allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
          availableSideBets: [],
          deckRotationStrategy: 'perShoe'
        });
      }

      // Also initialize gameState
      if (gameState.initializeGame) {
        gameState.initializeGame({
          variant: 'classic',
          numberOfDecks: 6,
          dealerHitsSoft17: true,
          blackjackPays: 1.5,
          doubleAfterSplit: true,
          resplitAces: false,
          lateSurrender: true,
          maxSplitHands: 4,
          penetration: 0.75,
          tableLimits: { minimumBet: 5, maximumBet: 500 },
          payoutRules: {
            blackjack: 1.5,
            insurance: 2,
            regularWin: 1,
            surrender: 0.5,
            sideBets: {} as Record<SideBetType, number | Record<string, number>>
          },
          allowedActions: ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'],
          availableSideBets: [],
          deckRotationStrategy: 'perShoe'
        });
      }

      // Initialize player spots
      const initialPlayerSpots: PlayerSpot[] = [
        { id: 'spot-1', position: 1, isOccupied: false },
        { id: 'spot-2', position: 2, isOccupied: false },
        { id: 'spot-3', position: 3, isOccupied: false }
      ];

      // Use setPlayers to prevent the unused parameter warning
      setPlayers(initialPlayerSpots);

      toast.success('Welcome to Royal Edge Casino', {
        description: 'Place your bets to begin playing!',
        duration: 5000,
      });

      setIsLoading(false);

      // Debug logs for player info
      setTimeout(() => {
        console.log('Player after initialization (gameStore):', gameStore.gameState?.players[0]);
        console.log('Player after initialization (gameState):', gameState.getActivePlayer());
      }, 500);
    };

    initGame();

    return () => {
      if (gameStore.gameState?.players[0]?.balance) {
        analytics.endSession(gameStore.gameState.players[0].balance);
      } else {
        analytics.endSession(0); // Default if balance not available
      }

      // Clean up any playing sounds
      Object.values(ambientSounds).forEach(sound => {
        if (sound && typeof sound.pause === 'function') {
          sound.pause();
          sound.currentTime = 0;
        }
      });
    };
  }, [gameStore, gameState, analytics, setIsLoading, setPlayers]);

  // Get dealer hand data from gameState
  const dealerHand = gameStore.gameState?.dealer?.hand || null;

  return { dealerHand };
};