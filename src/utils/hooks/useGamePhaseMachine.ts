'use client';

import { useMemo } from 'react';
import { useGamePhase } from '@/store/slices/gamePhaseSlice';
import type { UIGamePhase, GameState as GameStateType } from '@/types/gameTypes';

interface GameStateExtended {
    dealerHand?: {
        isBusted?: boolean;
    };
    playerHands?: Array<{
        isBlackjack?: boolean;
        result?: string;
    }>;
    handHistory?: unknown[];
}

export interface GamePhaseMessages {
    message: string;
    type: 'player' | 'dealer' | 'success' | 'warning' | 'info';
}

export function useGamePhaseMachine(
    gameState: any,
    playerBalance: number,
    onPhaseChange?: (phase: UIGamePhase) => void,
    externalPhase?: UIGamePhase
) {
    const { currentPhase, transitionTo } = useGamePhase();

    // Extract game state for message mapping
    const extendedGameState = gameState.gameState ?
        (gameState.gameState as unknown as GameStateExtended) : null;

    // Propagate external phase changes
    useMemo(() => {
        if (externalPhase && externalPhase !== currentPhase) {
            transitionTo(externalPhase, 'manual_transition');
        }
    }, [externalPhase, currentPhase, transitionTo]);

    // Notify parent component of internal phase changes
    useMemo(() => {
        if (onPhaseChange) {
            onPhaseChange(currentPhase);
        }
    }, [currentPhase, onPhaseChange]);

    // Get message type based on game phase
    const messageType = useMemo(() => {
        switch (currentPhase) {
            case 'playerTurn':
                return 'player';
            case 'dealerTurn':
                return 'dealer';
            case 'settlement': {
                const activePlayer = gameState.getActivePlayer();
                return activePlayer?.balance && playerBalance && activePlayer.balance > playerBalance
                    ? 'success'
                    : 'warning';
            }
            default:
                return 'info';
        }
    }, [currentPhase, gameState, playerBalance]);

    // Get game message based on phase
    const message = useMemo(() => {
        let message = 'Place your bet to begin';

        switch (currentPhase) {
            case 'betting':
                // Default message already set
                break;
            case 'dealing':
                message = 'Dealing cards...';
                break;
            case 'playerTurn':
                message = 'Your turn - Hit or Stand?';
                break;
            case 'dealerTurn':
                message = 'Dealer\'s turn';
                break;
            case 'settlement':
                if (!extendedGameState) {
                    message = 'Game over';
                    break;
                }

                {
                    const dealerHand = extendedGameState.dealerHand;
                    const playerHands = extendedGameState.playerHands || [];

                    if (playerHands.length > 0 && playerHands[0]?.isBlackjack) {
                        message = 'Blackjack! You win!';
                    } else if (dealerHand?.isBusted) {
                        message = 'Dealer busts! You win!';
                    } else if (playerHands.length > 0 && playerHands[0]?.result === 'win') {
                        message = 'You win!';
                    } else if (playerHands.length > 0 && playerHands[0]?.result === 'push') {
                        message = 'Push - Bet returned';
                    } else {
                        message = 'Dealer wins';
                    }
                }
                break;
        }

        return message;
    }, [currentPhase, extendedGameState]);

    return {
        currentPhase,
        transitionTo,
        messageType,
        message
    };
}