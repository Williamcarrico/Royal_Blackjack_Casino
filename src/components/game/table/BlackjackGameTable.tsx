'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/utils';
import BlackjackTable from './table/BlackjackTable';
import ActionPanel from './actions/ActionPanel';
import GameSidebar from './controls/GameSidebar';
import MessageDisplay from './status/MessageDisplay';
import { useGameState } from '@/hooks/game/useGameState';
import { useGameStore } from '@/store/gameStore';
import { useGamePhaseMachine } from '@/hooks/game/useGamePhaseMachine';
import { useTableActions } from '@/hooks/game/useTableActions';
import type { UIGamePhase } from '@types/gameTypes';

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
    onPhaseChange?: (phase: UIGamePhase) => void;
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
    // Use the game state and store hooks
    const gameState = useGameState();
    const {
        currentBet,
        canDoubleDown,
        canSplit,
        canSurrender
    } = useGameStore();

    // Use the phase machine hook for phase transitions and messaging
    const { currentPhase, message, messageType } = useGamePhaseMachine(
        gameState,
        playerBalance,
        onPhaseChange,
        gamePhase
    );

    // Use the table actions hook for all game actions
    const {
        handlePlaceBet,
        handleClearBet,
        handleDealCards,
        handleHit,
        handleStand,
        handleDouble,
        handleSplit,
        handleSurrender
    } = useTableActions(gameState);

    // Get active player and hand
    const activePlayer = gameState.getActivePlayer();
    const activeHand = gameState.getActiveHand();
    const availableActions = gameState.getAvailableActions();

    // Extended gameState with custom interface
    const extendedGameState = gameState.gameState ?
        (gameState.gameState as unknown as GameStateExtended) : null;

    // Memoize derived values
    const effectivePlayerBalance = useMemo(() =>
        (activePlayer?.balance ?? playerBalance) || 1500,
        [activePlayer?.balance, playerBalance]);

    // Get hand count safely
    const handCount = useMemo(() => {
        if (!extendedGameState) return 0;
        return extendedGameState.handHistory?.length ?? 0;
    }, [extendedGameState]);

    return (
        <div className={cn('flex h-full w-full', className)}>
            {/* Main content area with table and message */}
            <div className="relative flex flex-col flex-1 h-full">
                {/* Message display at the top */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-[80%] max-w-[600px]">
                    <MessageDisplay
                        message={message}
                        type={messageType}
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
                        handCount={handCount}
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