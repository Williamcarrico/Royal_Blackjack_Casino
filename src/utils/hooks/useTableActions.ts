'use client';

import { useGameStore } from '@/store/gameStore';
import { useGameSounds } from '@/store/slices/audioSlice';
import { HandAction } from '@/types/handTypes';

// Interface for gameState with additional action methods
interface GameStateWithExtraActions {
    performAction?: (playerId: string, handId: string, action: HandAction) => void;
}

export function useTableActions(gameState: any) {
    const { currentBet, clearBets } = useGameStore();
    const { playCardSound, playChipSound, playActionSound } = useGameSounds();

    // Get active player and hand
    const activePlayer = gameState.getActivePlayer();
    const activeHand = gameState.getActiveHand();

    // Handle placing a bet
    const handlePlaceBet = (bet: number) => {
        if (activePlayer) {
            playChipSound('bet');
            gameState.placeBet(activePlayer.id, bet);
        }
    };

    // Handle clearing a bet
    const handleClearBet = () => {
        clearBets();
    };

    // Handle dealing cards after bet is placed
    const handleDealCards = () => {
        if (currentBet <= 0) {
            return;
        }

        playCardSound('shuffle');
        gameState.dealCards();
    };

    // Handle player actions
    const handleHit = () => {
        if (activePlayer && activeHand) {
            playCardSound('deal');
            playActionSound('hit');
            gameState.hit(activePlayer.id, activeHand.id);
        }
    };

    const handleStand = () => {
        if (activePlayer && activeHand) {
            playActionSound('stand');
            gameState.stand(activePlayer.id, activeHand.id);
        }
    };

    const handleDouble = () => {
        if (activePlayer && activeHand) {
            playChipSound('bet');
            playActionSound('double');
            gameState.double(activePlayer.id, activeHand.id);
        }
    };

    const handleSplit = () => {
        if (activePlayer && activeHand) {
            playChipSound('bet');
            playCardSound('deal');
            playActionSound('split');

            // Check if performAction exists on gameState
            const extendedActions = gameState as unknown as GameStateWithExtraActions;
            if (typeof extendedActions.performAction === 'function') {
                extendedActions.performAction(activePlayer.id, activeHand.id, 'split');
            }
        }
    };

    const handleSurrender = () => {
        if (activePlayer && activeHand) {
            playActionSound('surrender');

            // Check if performAction exists on gameState
            const extendedActions = gameState as unknown as GameStateWithExtraActions;
            if (typeof extendedActions.performAction === 'function') {
                extendedActions.performAction(activePlayer.id, activeHand.id, 'surrender');
            }
        }
    };

    return {
        handlePlaceBet,
        handleClearBet,
        handleDealCards,
        handleHit,
        handleStand,
        handleDouble,
        handleSplit,
        handleSurrender
    };
}