'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import BlackjackTable from './table/BlackjackTable';
import ActionPanel from './actions/ActionPanel';
import GameSidebar from './controls/GameSidebar';
import MessageDisplay from './status/MessageDisplay';
import { useGameState } from '@/hooks/game/useGameState';
import { useGameStore } from '@/store/gameStore';
import { useGamePhase } from '@/store/slices/gamePhaseSlice';
import { HandAction } from '@/types/handTypes';
import { useGameSounds } from '@/store/slices/audioSlice';

// Define UIGamePhase locally if it's not imported from elsewhere
export type UIGamePhase = 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';

// Define types for the game state properties we're accessing
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

export interface BlackjackGameTableProps {
    className?: string;
    playerName?: string;
    playerBalance?: number;
    tableVariant?: 'green' | 'red' | 'blue' | 'black' | 'dark' | 'light' | 'vip';
    onSettingsOpen?: () => void;
    onRulesOpen?: () => void;
    onBankrollOpen?: () => void;
    onHistoryOpen?: () => void;
    onChatOpen?: () => void;
    isSoundEnabled?: boolean;
    onToggleSound?: () => void;
    showSidebar?: boolean;
    gamePhase?: UIGamePhase;
    onPhaseChange?: (uiPhase: UIGamePhase) => void;
}

/**
 * BlackjackGameTable integrates all blackjack components into a cohesive game experience
 * Combines table, actions, sidebar, and messaging for a complete blackjack game
 */
const BlackjackGameTable: React.FC<BlackjackGameTableProps> = ({
    className,
    playerName = 'Player',
    playerBalance = 1000,
    tableVariant = 'green',
    onSettingsOpen,
    onRulesOpen,
    onBankrollOpen,
    onHistoryOpen,
    onChatOpen,
    isSoundEnabled = true,
    onToggleSound,
    showSidebar = true,
    gamePhase,
    onPhaseChange,
}) => {
    // Use the game store and hooks
    const { currentPhase, transitionTo } = useGamePhase();
    const gameState = useGameState();
    const {
        currentBet,
        clearBets,
        canDoubleDown,
        canSplit,
        canSurrender
    } = useGameStore();
    const { playCardSound, playChipSound, playActionSound } = useGameSounds();

    // Get active player and hand
    const activePlayer = gameState.getActivePlayer();
    const activeHand = gameState.getActiveHand();
    const availableActions = gameState.getAvailableActions();

    // Extended gameState with custom interface
    const extendedGameState = gameState.gameState ?
        (gameState.gameState as unknown as GameStateExtended) : null;

    // Map external UI phase to internal store phase
    const mapUIPhaseToStorePhase = (uiPhase: UIGamePhase) => {
        switch (uiPhase) {
            case 'betting': return 'betting';
            case 'dealing': return 'dealing';
            case 'player-turn': return 'playerTurn';
            case 'dealer-turn': return 'dealerTurn';
            case 'payout': return 'settlement';
            case 'game-over': return 'cleanup';
            default: return 'betting';
        }
    };

    // Handle external phase changes
    useEffect(() => {
        if (gamePhase && mapUIPhaseToStorePhase(gamePhase) !== currentPhase) {
            transitionTo(mapUIPhaseToStorePhase(gamePhase), 'manual_transition');
        }
    }, [gamePhase, currentPhase, transitionTo]);

    // Notify parent component of internal phase changes
    useEffect(() => {
        if (onPhaseChange) {
            // Map internal game phases to external API phases
            let mappedPhase: UIGamePhase;

            switch (currentPhase) {
                case 'betting':
                    mappedPhase = 'betting';
                    break;
                case 'dealing':
                    mappedPhase = 'dealing';
                    break;
                case 'playerTurn':
                    mappedPhase = 'player-turn';
                    break;
                case 'dealerTurn':
                    mappedPhase = 'dealer-turn';
                    break;
                case 'settlement':
                    mappedPhase = 'payout';
                    break;
                case 'cleanup':
                    mappedPhase = 'betting';
                    break;
                default:
                    mappedPhase = 'betting';
            }

            onPhaseChange(mappedPhase);
        }
    }, [currentPhase, onPhaseChange]);

    // Map message type based on game phase
    const getMessageType = () => {
        switch (currentPhase) {
            case 'playerTurn':
                return 'player';
            case 'dealerTurn':
                return 'dealer';
            case 'settlement':
                return activePlayer?.balance && playerBalance && activePlayer.balance > playerBalance ? 'success' : 'warning';
            default:
                return 'info';
        }
    };

    // Get game message based on phase
    const getMessage = () => {
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
    };

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

    // Define an interface for split and surrender actions
    interface GameStateWithExtraActions {
        performAction?: (playerId: string, handId: string, action: HandAction) => void;
    }

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

    // Get effective player balance
    const effectivePlayerBalance = (activePlayer?.balance ?? playerBalance) || 1500;

    // Get hand count safely
    const getHandCount = () => {
        if (!extendedGameState) return 0;
        return extendedGameState.handHistory?.length ?? 0;
    };

    return (
        <div className={cn('flex h-full w-full', className)}>
            {/* Main content area with table and message */}
            <div className="relative flex flex-col flex-1 h-full">
                {/* Message display at the top */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-[80%] max-w-[600px]">
                    <MessageDisplay
                        message={getMessage()}
                        type={getMessageType()}
                        size="md"
                        variant="solid"
                        centered
                        withBackground
                    />
                </div>

                {/* Blackjack table */}
                <div className="flex items-center justify-center flex-1 p-4">
                    <BlackjackTable
                        variant={tableVariant}
                        playerBalance={effectivePlayerBalance}
                        currentBet={currentBet}
                        onPlaceBet={handlePlaceBet}
                        onClearBet={handleClearBet}
                        onDealCards={handleDealCards}
                        isBettingPhase={currentPhase === 'betting'}
                        disableBetting={currentPhase !== 'betting'}
                    />
                </div>

                {/* Action panel at the bottom */}
                {currentPhase === 'playerTurn' && activeHand && (
                    <div className="absolute z-30 transform -translate-x-1/2 bottom-8 left-1/2">
                        <ActionPanel
                            onHit={handleHit}
                            onStand={handleStand}
                            onDouble={handleDouble}
                            onSplit={handleSplit}
                            onSurrender={handleSurrender}
                            canHit={availableActions.includes('hit')}
                            canStand={availableActions.includes('stand')}
                            canDouble={availableActions.includes('double') && canDoubleDown()}
                            canSplit={availableActions.includes('split') && canSplit()}
                            canSurrender={availableActions.includes('surrender') && canSurrender()}
                            isPlayerTurn={currentPhase === 'playerTurn'}
                        />
                    </div>
                )}
            </div>

            {/* Sidebar for game info and controls */}
            {showSidebar && (
                <div className="fixed top-0 right-0 z-40 h-full py-4">
                    <GameSidebar
                        playerName={activePlayer?.name ?? playerName}
                        playerBalance={effectivePlayerBalance}
                        playerWinStreak={0} // Could be computed from game history
                        currentBet={currentBet}
                        handCount={getHandCount()}
                        onOpenSettings={onSettingsOpen}
                        onOpenRules={onRulesOpen}
                        onOpenBankroll={onBankrollOpen}
                        onOpenHistory={onHistoryOpen}
                        onOpenChat={onChatOpen}
                        onToggleSound={onToggleSound}
                        isSoundEnabled={isSoundEnabled}
                        showControlLabels={true}
                        variant="dark"
                    />
                </div>
            )}
        </div>
    );
};

export default BlackjackGameTable;