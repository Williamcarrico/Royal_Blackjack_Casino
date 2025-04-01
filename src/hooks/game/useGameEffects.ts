import { useEffect } from 'react';
import { GameStore } from '@/types/storeTypes';

// Define types for hands and cards
interface HandEntity {
    cards: Array<unknown>;
    [key: string]: unknown;
}

// Define PlayerSpot interface since it's not exported from gameTypes
interface PlayerSpot {
    id: number;
    position: string;
    hand: Record<string, unknown> | null;
    hands?: Array<{
        id: string;
        cards: unknown[];
        bet: number;
    }>;
    chips: number;
    bet: number;
    isActive: boolean;
    isCurrentPlayer: boolean;
    result?: string;
}

// Extended GameStore interface with additional properties used in this component
interface ExtendedGameStore extends GameStore {
    gamePhase: string;
    roundResult: string | null;
    bet: number;
    chips: number;
    tableColor: string;
    activePlayerHandId: string | null;
    playerHandIds: string[];
    entities: {
        hands: Record<string, HandEntity>;
        cards: Record<string, unknown>;
    };
    resetRound: () => void;
}

export const useGameEffects = (
    gameStore: ExtendedGameStore,
    soundEnabled: boolean,
    playSound: (sound: string) => void,
    setPlayers: (players: React.SetStateAction<PlayerSpot[]>) => void,
    isMobile: boolean,
    isTablet: boolean,
    setIsTableRotated: (isRotated: boolean) => void
) => {
    // Play game sound effects based on game phase
    useEffect(() => {
        if (!soundEnabled) return;

        if (gameStore.gamePhase === 'dealing') {
            playSound('deal');
        } else if (gameStore.gamePhase === 'settlement' && gameStore.roundResult === 'win') {
            playSound('win');
        } else if (gameStore.gamePhase === 'betting' && gameStore.bet > 0) {
            playSound('chips');
        }
    }, [gameStore.gamePhase, gameStore.roundResult, gameStore.bet, soundEnabled, playSound]);

    // Update player hand data when game state changes
    useEffect(() => {
        const updatePlayerHands = () => {
            const playerHand = gameStore.activePlayerHandId
                ? gameStore.entities.hands[gameStore.activePlayerHandId]
                : null;

            // Get all player hands
            const playerHands = gameStore.playerHandIds.map((id: string) =>
                gameStore.entities.hands[id] || null
            );

            setPlayers(prevPlayers => {
                const newPlayers = [...prevPlayers];
                const centerPlayerIndex = newPlayers.findIndex(p => p.position === 'center');

                if (centerPlayerIndex !== -1) {
                    const currentPlayer = newPlayers[centerPlayerIndex];

                    // Only proceed if currentPlayer is defined
                    if (currentPlayer) {
                        // Update the center player with their hand
                        newPlayers[centerPlayerIndex] = {
                            id: currentPlayer.id,
                            position: currentPlayer.position,
                            hand: playerHand || null,
                            hands: playerHands.map((hand, idx) => ({
                                id: idx.toString(),
                                cards: hand?.cards || [],
                                bet: gameStore.bet
                            })),
                            chips: gameStore.chips,
                            bet: gameStore.bet,
                            isActive: gameStore.gamePhase === 'playerTurn',
                            isCurrentPlayer: currentPlayer.isCurrentPlayer,
                            result: gameStore.roundResult || undefined,
                        };
                    }
                }

                return newPlayers;
            });
        };

        updatePlayerHands();
    }, [
        gameStore.entities.hands,
        gameStore.activePlayerHandId,
        gameStore.playerHandIds,
        gameStore.gamePhase,
        gameStore.chips,
        gameStore.bet,
        gameStore.roundResult,
        setPlayers
    ]);

    // Start game loop if completed or in settlement
    useEffect(() => {
        if (gameStore.gamePhase === 'completed' || gameStore.gamePhase === 'settlement') {
            const timer = setTimeout(() => {
                gameStore.resetRound();
            }, 3000);
            return () => clearTimeout(timer);
        }
        return undefined; // Add explicit return to fix TS7030 error
    }, [gameStore.gamePhase, gameStore]);

    // Apply responsive layout adjustments
    useEffect(() => {
        setIsTableRotated(isTablet && !isMobile);
    }, [isMobile, isTablet, setIsTableRotated]);

    // Apply theme-specific styling
    useEffect(() => {
        document.documentElement.style.setProperty('--table-theme-color', gameStore.tableColor || '#1a5f7a');
    }, [gameStore.tableColor]);
};