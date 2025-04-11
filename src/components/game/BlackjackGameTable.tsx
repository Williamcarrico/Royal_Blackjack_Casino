'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils/utils';
import BlackjackTable from './table/BlackjackTable';
import ActionPanel from './actions/ActionPanel';
import GameSidebar from './controls/GameSidebar';
import MessageDisplay from './status/MessageDisplay';

export type GamePhase = 'idle' | 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';

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
    gamePhase?: GamePhase;
    onPhaseChange?: (phase: GamePhase) => void;
}

/**
 * BlackjackGameTable integrates all blackjack components into a cohesive game experience
 * Combines table, actions, sidebar, and messaging for a complete blackjack game
 */
const BlackjackGameTable: React.FC<BlackjackGameTableProps> = ({
    className,
    playerName = 'Player',
    playerBalance = 1500,
    tableVariant = 'green',
    onSettingsOpen,
    onRulesOpen,
    onBankrollOpen,
    onHistoryOpen,
    onChatOpen,
    isSoundEnabled = true,
    onToggleSound,
    showSidebar = true,
    gamePhase = 'betting',
    onPhaseChange,
}) => {
    // Game state - remove local gamePhase state
    const [currentBet, setCurrentBet] = useState(0);
    const [winStreak, setWinStreak] = useState(0);
    const [handCount, setHandCount] = useState(0);
    const [message, setMessage] = useState<string | null>('Place your bet to begin');
    const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error' | 'dealer' | 'player'>('info');

    // Refs for the game table
    const tableRef = useRef<HTMLDivElement>(null);

    // Handle placing a bet
    const handlePlaceBet = (bet: number) => {
        setCurrentBet(bet);
        setMessage(`Bet: $${bet}`);
    };

    // Handle clearing a bet
    const handleClearBet = () => {
        setCurrentBet(0);
        setMessage('Place your bet to begin');
    };

    // Player turn transitions
    const transitionToPlayerTurn = () => {
        if (onPhaseChange) {
            onPhaseChange('player-turn');
        }
        setMessage('Your turn - Hit or Stand?');
        setMessageType('player');
        setHandCount(prevCount => prevCount + 1);
    };

    // Handle dealing cards after bet is placed
    const handleDealCards = () => {
        if (currentBet <= 0) {
            setMessage('Please place a bet first');
            setMessageType('warning');
            return;
        }

        if (onPhaseChange) {
            onPhaseChange('dealing');
        }
        setMessage('Dealing cards...');

        // Simulate card dealing
        setTimeout(transitionToPlayerTurn, 1500);
    };

    // Reset game to betting phase
    const resetToBettingPhase = () => {
        if (onPhaseChange) {
            onPhaseChange('betting');
        }
        setCurrentBet(0);
        setMessage('Place your bet to begin');
        setMessageType('info');
    };

    // Process win and payout
    const processWinAndPayout = () => {
        setMessage('Player wins!');
        setMessageType('success');
        if (onPhaseChange) {
            onPhaseChange('payout');
        }
        setWinStreak(prev => prev + 1);

        // Reset after payout
        setTimeout(resetToBettingPhase, 3000);
    };

    // Dealer actions
    const performDealerActions = () => {
        setMessage('Dealer\'s turn');
        setMessageType('dealer');

        // Simulate dealer actions
        setTimeout(processWinAndPayout, 2000);
    };

    // Handle player actions
    const handleHit = () => {
        setMessage('Player hits');
        setMessageType('player');

        // Simulated hit logic would go here
    };

    const handleStand = () => {
        setMessage('Player stands');
        setMessageType('player');
        if (onPhaseChange) {
            onPhaseChange('dealer-turn');
        }

        // Simulated dealer turn
        setTimeout(performDealerActions, 1000);
    };

    const handleDouble = () => {
        setMessage('Player doubles down');
        setMessageType('player');
        const doubledBet = currentBet * 2;
        setCurrentBet(doubledBet);

        // After doubling, stand automatically
        setTimeout(handleStand, 1500);
    };

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
                        ref={tableRef}
                        variant={tableVariant}
                        playerBalance={playerBalance}
                        currentBet={currentBet}
                        onPlaceBet={handlePlaceBet}
                        onClearBet={handleClearBet}
                        onDealCards={handleDealCards}
                        isBettingPhase={gamePhase === 'betting'}
                        isActionPhase={gamePhase === 'player-turn'}
                        disableBetting={gamePhase !== 'betting'}
                    />
                </div>

                {/* Action panel at the bottom */}
                {gamePhase === 'player-turn' && (
                    <div className="absolute z-30 transform -translate-x-1/2 bottom-8 left-1/2">
                        <ActionPanel
                            onHit={handleHit}
                            onStand={handleStand}
                            onDouble={handleDouble}
                            canHit={true}
                            canStand={true}
                            canDouble={true}
                            canSplit={false}
                            isPlayerTurn={true}
                        />
                    </div>
                )}
            </div>

            {/* Sidebar for game info and controls */}
            {showSidebar && (
                <div className="h-full py-4 pr-4">
                    <GameSidebar
                        playerName={playerName}
                        playerBalance={playerBalance}
                        playerWinStreak={winStreak}
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