'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/utils';
import ActionPanel from '@/components/game/actions/ActionPanel';
import ChipSelector from '@/components/betting/ChipSelector';
import { Button } from '@/components/ui/button';
import { Coins, RotateCcw, HandMetal } from 'lucide-react';
import { GamePhase } from '@/components/game/BlackjackGameTable';
import { HandAction } from '@/types/handTypes';

interface GameFooterProps {
    gamePhase: GamePhase;
    onPlaceBet?: (amount: number) => void;
    onDeal?: () => void;
    onHit?: () => void;
    onStand?: () => void;
    onDouble?: () => void;
    onSplit?: () => void;
    onSurrender?: () => void;
    onNextRound?: () => void;
    availableActions?: HandAction[];
    isPlayerTurn?: boolean;
    isDealerTurn?: boolean;
    isRoundOver?: boolean;
    currentBet?: number;
    playerBalance?: number;
    className?: string;
}

/**
 * GameFooter component provides context-aware controls for the blackjack game
 * Shows different controls based on the current game phase
 */
const GameFooter: React.FC<GameFooterProps> = ({
    gamePhase,
    onPlaceBet,
    onDeal,
    onHit,
    onStand,
    onDouble,
    onSplit,
    onSurrender,
    onNextRound,
    availableActions = [],
    isPlayerTurn = false,
    isDealerTurn: _isDealerTurn = false,
    isRoundOver: _isRoundOver = false,
    currentBet = 0,
    playerBalance = 1500,
    className,
}) => {
    const [selectedChipValue, setSelectedChipValue] = useState(25);

    // Helper to determine if an action is available
    const isActionAvailable = (action: HandAction) => {
        return availableActions.includes(action);
    };

    return (
        <footer className={cn(
            'w-full bg-black/40 backdrop-blur-md border-t border-amber-900/30',
            'py-4 px-6 md:px-8 shadow-lg',
            'fixed bottom-0 left-0 right-0 z-40',
            className
        )}>
            <div className="mx-auto max-w-7xl">
                <AnimatePresence mode="wait">
                    {/* Betting controls - shown during betting phase */}
                    {gamePhase === 'betting' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-between gap-6 sm:flex-row"
                        >
                            <div className="flex flex-col items-center w-full gap-5 sm:w-auto sm:flex-row">
                                <ChipSelector
                                    selectedValue={selectedChipValue}
                                    onSelect={setSelectedChipValue}
                                    chipValues={[5, 10, 25, 50, 100, 500]}
                                    playerBalance={playerBalance}
                                    chipStyle="luxury"
                                    className="flex-wrap justify-center"
                                />

                                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => onPlaceBet && onPlaceBet(selectedChipValue)}
                                        className="font-bold bg-amber-800/60 border-amber-600/80 text-amber-100 hover:bg-amber-700/70"
                                        disabled={selectedChipValue > playerBalance}
                                    >
                                        <Coins className="w-5 h-5 mr-2" />
                                        Place Bet
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => onPlaceBet && onPlaceBet(playerBalance)}
                                        className="font-bold bg-amber-800/60 border-amber-600/80 text-amber-100 hover:bg-amber-700/70"
                                        disabled={playerBalance <= 0}
                                    >
                                        <HandMetal className="w-5 h-5 mr-2" />
                                        All In
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end w-full gap-3 mt-4 sm:w-auto sm:mt-0">
                                <div className="px-5 py-3 border rounded-md bg-amber-950/70 border-amber-800/50">
                                    <span className="mr-2 text-sm text-amber-400/90">Current Bet:</span>
                                    <span className="text-lg font-bold text-amber-100">${currentBet}</span>
                                </div>

                                <Button
                                    variant="default"
                                    size="lg"
                                    onClick={onDeal}
                                    className="px-8 py-6 text-lg font-bold text-white bg-green-700 hover:bg-green-600"
                                    disabled={currentBet <= 0}
                                >
                                    Deal Cards
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Action controls - shown during player turn */}
                    {gamePhase === 'player-turn' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-center"
                        >
                            <ActionPanel
                                onHit={onHit}
                                onStand={onStand}
                                onDouble={onDouble}
                                onSplit={onSplit}
                                onSurrender={onSurrender}
                                canHit={isActionAvailable('hit')}
                                canStand={isActionAvailable('stand')}
                                canDouble={isActionAvailable('double')}
                                canSplit={isActionAvailable('split')}
                                canSurrender={isActionAvailable('surrender')}
                                isPlayerTurn={isPlayerTurn}
                            />
                        </motion.div>
                    )}

                    {/* Dealer turn message */}
                    {gamePhase === 'dealer-turn' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-center"
                        >
                            <div className="px-8 py-4 text-center border rounded-md bg-amber-900/50 border-amber-700/60">
                                <p className="text-xl font-medium text-amber-100">Dealer&apos;s Turn</p>
                                <p className="text-sm text-amber-400/90">The dealer is playing their hand...</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Round over controls */}
                    {(gamePhase === 'payout' || gamePhase === 'game-over') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-center"
                        >
                            <Button
                                variant="default"
                                size="lg"
                                onClick={onNextRound}
                                className="px-10 py-6 text-lg font-bold text-white bg-amber-700 hover:bg-amber-600"
                            >
                                <RotateCcw className="w-6 h-6 mr-3" />
                                Next Round
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </footer>
    );
};

export default GameFooter;