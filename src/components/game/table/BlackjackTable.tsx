'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TableFelt from './TableFelt';
import PlayerPosition from './PlayerPosition';
import DealerPosition from './DealerPosition';
import BettingControls from '../../betting/BettingControls';
import ActionPanel, { GameActionState } from '../actions/ActionPanel';
import { GameAction } from '../actions/ActionButton';
import { ChipValue } from '../../betting/Chip';
import { CardData } from '../hand/Hand';
import MessageDisplay from '../status/MessageDisplay';

export interface PlayerData {
    id: string;
    name: string;
    balance: number;
    hands: {
        id: string;
        cards: CardData[];
        bet: number;
        betChips: Array<{ value: ChipValue; count: number }>;
        isActive?: boolean;
        result?: 'win' | 'lose' | 'push' | 'blackjack';
        insurance?: number;
    }[];
}

export interface DealerData {
    cards: CardData[];
    isActive?: boolean;
    result?: 'win' | 'lose' | 'push';
}

export interface BlackjackTableProps {
    players: PlayerData[];
    dealer: DealerData;
    currentPlayerId?: string;
    activeHandId?: string;
    gamePhase: 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
    minBet: number;
    maxBet: number;
    availableActions: Partial<GameActionState>;
    recommendedAction?: GameAction;
    message?: string;
    className?: string;
    darkMode?: boolean;
    onPlaceBet?: (playerId: string, bet: number) => void;
    onClearBet?: (playerId: string) => void;
    onAction?: (action: GameAction, playerId: string, handId: string) => void;
    onDealCards?: () => void;
    hideControls?: boolean;
    enableChips?: boolean;
    showBettingControls?: boolean;
}

const BlackjackTable = ({
    players = [],
    dealer,
    currentPlayerId,
    activeHandId,
    gamePhase,
    minBet,
    maxBet,
    availableActions,
    recommendedAction,
    message,
    className = '',
    darkMode = true,
    onPlaceBet,
    onClearBet,
    onAction,
    onDealCards,
    hideControls = false,
    enableChips = true,
    showBettingControls = true,
}: BlackjackTableProps) => {
    const [showMessage, setShowMessage] = useState(!!message);

    // Update message visibility when message changes
    useEffect(() => {
        if (message) {
            setShowMessage(true);
            const timer = setTimeout(() => {
                setShowMessage(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
        return undefined; // Explicitly return undefined for the falsy path
    }, [message]);

    // Find current player
    const currentPlayer = players?.find(player => player.id === currentPlayerId);

    // Find active hand of current player
    const activeHand = currentPlayer?.hands.find(hand => hand.id === activeHandId);

    // Handle action callback
    const handleAction = (action: GameAction) => {
        if (gamePhase === 'betting' && action === 'deal') {
            onDealCards?.();
            return;
        }

        if (currentPlayerId && activeHandId) {
            onAction?.(action, currentPlayerId, activeHandId);
        }
    };

    // Handle bet placement
    const handlePlaceBet = (bet: number) => {
        if (currentPlayerId) {
            onPlaceBet?.(currentPlayerId, bet);
        }
    };

    // Handle clearing bet
    const handleClearBet = () => {
        if (currentPlayerId) {
            onClearBet?.(currentPlayerId);
        }
    };

    // Determine if we should show betting controls
    const shouldShowBettingControls = showBettingControls && gamePhase === 'betting' && currentPlayer;

    // Determine if we should show action controls
    const shouldShowActionControls = !hideControls && ['player-turn', 'dealer-turn', 'payout'].includes(gamePhase);

    // Table layout variants
    const tableVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: 0.5 }
        },
        exit: { opacity: 0 }
    };

    return (
        <motion.div
            className={cn(
                'relative w-full max-w-6xl mx-auto overflow-hidden',
                'rounded-3xl shadow-2xl',
                darkMode ? 'bg-green-900' : 'bg-green-700',
                className
            )}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={tableVariants}
        >
            {/* Table felt background */}
            <TableFelt darkMode={darkMode}>
                {/* Dealer position - with proper z-index for layering */}
                <div className="absolute z-20 transform -translate-x-1/2 top-24 left-1/2">
                    <DealerPosition
                        cards={dealer.cards}
                        isActive={dealer.isActive}
                        gamePhase={gamePhase}
                        result={dealer.result}
                    />
                </div>

                {/* Player positions - increased z-index for proper layer stacking */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-8 px-4 pb-36 md:pb-28 z-30">
                    {(players || []).map((player) => (
                        <PlayerPosition
                            key={player.id}
                            player={player}
                            isCurrentPlayer={player.id === currentPlayerId}
                            gamePhase={gamePhase}
                            activeHandId={activeHandId}
                            onBetChange={onPlaceBet ? (amount) => onPlaceBet(player.id, amount) : undefined}
                            enableChips={enableChips}
                        />
                    ))}
                </div>

                {/* Message display - highest z-index to appear above all elements */}
                <AnimatePresence>
                    {showMessage && message && (
                        <div className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                            <MessageDisplay message={message} />
                        </div>
                    )}
                </AnimatePresence>
            </TableFelt>

            {/* Controls area - improved z-index for controls layer */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 p-4 z-40 bg-gradient-to-t from-black/50 to-transparent pt-16">
                {/* Betting controls */}
                {shouldShowBettingControls && currentPlayer && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="betting-controls"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full max-w-lg"
                        >
                            <BettingControls
                                balance={currentPlayer.balance}
                                minBet={minBet}
                                maxBet={maxBet}
                                currentBet={currentPlayer?.hands?.[0]?.bet ?? 0}
                                onPlaceBet={handlePlaceBet}
                                onClearBet={handleClearBet}
                                autoConfirm={false}
                                availableChips={[1, 5, 25, 100, 500, 1000]}
                            />
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Action controls */}
                {shouldShowActionControls && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="action-controls"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full max-w-lg"
                        >
                            <ActionPanel
                                availableActions={availableActions}
                                recommendedAction={recommendedAction}
                                onAction={handleAction}
                                player={currentPlayerId}
                                handId={activeHandId}
                                animateEntry={true}
                                activeHandData={activeHand}
                            />
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};

export default BlackjackTable;