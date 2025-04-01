import { useEffect } from 'react';
import { toast } from 'sonner';
import { GameStore } from '@/types/storeTypes';
import { SideBetType } from '@/types/betTypes';

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
  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      // Start analytics session with initial balance
      if (gameStore.gameState?.players[0]?.balance) {
        analytics.startSession(gameStore.gameState.players[0].balance);
      } else {
        analytics.startSession(0); // Default balance if not available
      }

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
  }, [gameStore, analytics, setIsLoading, setPlayers]);

  // Get dealer hand data from gameState
  const dealerHand = gameStore.gameState?.dealer?.hand || null;

  return { dealerHand };
};