'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/utils';
import ActionPanel from '@/components/game/actions/ActionPanel';
import ChipSelector from '@/components/betting/ChipSelector';
import { Button } from '@/components/ui/button';
import {
    Coins,
    RotateCcw,
    X,
    ArrowUp,
    Plus,
    ChevronsRight,
    BadgeDollarSign,
    Sparkles,
    Ban,
    RefreshCw
} from 'lucide-react';
import { UIGamePhase } from '@/components/game/BlackjackGameTable';
import { HandAction } from '@/types/handTypes';

interface GameFooterProps {
    gamePhase: UIGamePhase;
    onPlaceBet?: (amount: number) => void;
    onClearBet?: () => void;
    onMaxBet?: () => void;
    onDoubleBet?: () => void;
    onDeal?: () => void;
    onHit?: () => void;
    onStand?: () => void;
    onDouble?: () => void;
    onSplit?: () => void;
    onSurrender?: () => void;
    onNextRound?: () => void;
    onEndGame?: () => void;
    onResetGame?: () => void;
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
 * Shows different controls based on the current game phase with sophisticated animations
 */
const GameFooter: React.FC<GameFooterProps> = ({
    gamePhase,
    onPlaceBet,
    onClearBet,
    onMaxBet,
    onDoubleBet,
    onDeal,
    onHit,
    onStand,
    onDouble,
    onSplit,
    onSurrender,
    onNextRound,
    onEndGame,
    onResetGame,
    availableActions = [],
    isPlayerTurn = false,
    isDealerTurn = false,
    isRoundOver = false,
    currentBet = 0,
    playerBalance = 1500,
    className,
}) => {
    const [selectedChipValue, setSelectedChipValue] = useState(25);
    const [showFooter, setShowFooter] = useState(true);
    const [lastSelectedChip, setLastSelectedChip] = useState<number | null>(null);

    // Animation when chip value changes
    useEffect(() => {
        if (selectedChipValue !== lastSelectedChip && lastSelectedChip !== null) {
            // You could play a sound here or add other effects
        }
        setLastSelectedChip(selectedChipValue);
    }, [selectedChipValue, lastSelectedChip]);

    // Helper to determine if an action is available
    const isActionAvailable = (action: HandAction) => {
        return availableActions.includes(action);
    };

    // Variants for animations
    const containerVariants = {
        hidden: { y: 100, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                staggerChildren: 0.1
            }
        },
        exit: {
            y: 100,
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        }
    };

    const childVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 25
            }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
            transition: {
                type: "spring",
                stiffness: 500
            }
        },
        tap: {
            scale: 0.95
        },
        disabled: {
            scale: 1,
            opacity: 0.6
        }
    };

    // Toggle footer visibility
    const toggleFooter = () => {
        setShowFooter(prev => !prev);
    };

    // Get phase-specific message
    const getPhaseMessage = () => {
        switch (gamePhase) {
            case 'betting': return "Place your bet to begin";
            case 'dealing': return "Dealing cards...";
            case 'player-turn': return "Make your decision";
            case 'dealer-turn': return "Dealer's turn";
            case 'payout': return "Hand completed";
            case 'game-over': return "Game over";
            default: return "";
        }
    };

    return (
        <>
            {/* Toggle button - only shown when footer is hidden */}
            {!showFooter && (
                <motion.button
                    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 py-2 px-4 rounded-full bg-amber-700 hover:bg-amber-600 shadow-lg"
                    onClick={toggleFooter}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    whileHover={buttonVariants.hover}
                    whileTap={buttonVariants.tap}
                >
                    <ChevronsRight className="w-5 h-5 text-white" />
                </motion.button>
            )}

            <AnimatePresence>
                {showFooter && (
                    <motion.footer
                        className={cn(
                            'w-full backdrop-blur-md',
                            'py-4 px-6 md:px-8 shadow-lg',
                            'fixed bottom-0 left-0 right-0 z-40',
                            'border-t border-amber-900/30',
                            className
                        )}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={containerVariants}
                    >
                        <div className="relative mx-auto max-w-7xl">
                            {/* Phase message banner */}
                            <motion.div
                                className="absolute -top-8 left-1/2 transform -translate-x-1/2 mb-2 py-1 px-4 bg-black/60 border border-amber-800/40 rounded-t-lg shadow-md"
                                variants={childVariants}
                            >
                                <span className="text-sm font-medium text-amber-300">{getPhaseMessage()}</span>
                                <button
                                    className="ml-3 text-amber-400 hover:text-amber-300"
                                    onClick={toggleFooter}
                                    aria-label="Hide footer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {/* Betting controls - shown during betting phase */}
                                {gamePhase === 'betting' && (
                                    <motion.div
                                        key="betting"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="flex flex-col items-center justify-between gap-6 sm:flex-row"
                                    >
                                        <motion.div
                                            className="flex flex-col items-center w-full gap-5 sm:w-auto sm:flex-row"
                                            variants={childVariants}
                                        >
                                            <ChipSelector
                                                selectedValue={selectedChipValue}
                                                onSelect={setSelectedChipValue}
                                                chipValues={[5, 10, 25, 50, 100, 500]}
                                                playerBalance={playerBalance}
                                                chipStyle="luxury"
                                                className="flex-wrap justify-center gap-3"
                                            />

                                            <motion.div
                                                className="flex items-center gap-2.5 mt-3 sm:mt-0"
                                                variants={childVariants}
                                            >
                                                <motion.button
                                                    onClick={() => onPlaceBet && onPlaceBet(selectedChipValue)}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center",
                                                        "bg-gradient-to-br from-amber-600 to-amber-800 text-white",
                                                        "border border-amber-500/20",
                                                        "transition-all duration-200 ease-in-out",
                                                        selectedChipValue > playerBalance && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    whileHover={selectedChipValue <= playerBalance ? buttonVariants.hover : buttonVariants.disabled}
                                                    whileTap={selectedChipValue <= playerBalance ? buttonVariants.tap : undefined}
                                                    disabled={selectedChipValue > playerBalance}
                                                >
                                                    <Coins className="w-4 h-4 mr-2" />
                                                    Place Bet
                                                </motion.button>

                                                <motion.button
                                                    onClick={onClearBet}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center",
                                                        "bg-gradient-to-br from-rose-600 to-rose-800 text-white",
                                                        "border border-rose-500/20",
                                                        "transition-all duration-200 ease-in-out",
                                                        currentBet <= 0 && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    whileHover={currentBet > 0 ? buttonVariants.hover : buttonVariants.disabled}
                                                    whileTap={currentBet > 0 ? buttonVariants.tap : undefined}
                                                    disabled={currentBet <= 0}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Clear
                                                </motion.button>

                                                <motion.button
                                                    onClick={onMaxBet}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center",
                                                        "bg-gradient-to-br from-purple-600 to-purple-800 text-white",
                                                        "border border-purple-500/20",
                                                        "transition-all duration-200 ease-in-out",
                                                        playerBalance <= 0 && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    whileHover={playerBalance > 0 ? buttonVariants.hover : buttonVariants.disabled}
                                                    whileTap={playerBalance > 0 ? buttonVariants.tap : undefined}
                                                    disabled={playerBalance <= 0}
                                                >
                                                    <ArrowUp className="w-4 h-4 mr-2" />
                                                    Max
                                                </motion.button>

                                                <motion.button
                                                    onClick={onDoubleBet}
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center",
                                                        "bg-gradient-to-br from-blue-600 to-blue-800 text-white",
                                                        "border border-blue-500/20",
                                                        "transition-all duration-200 ease-in-out",
                                                        (currentBet <= 0 || currentBet * 2 > playerBalance) && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    whileHover={(currentBet > 0 && currentBet * 2 <= playerBalance) ? buttonVariants.hover : buttonVariants.disabled}
                                                    whileTap={(currentBet > 0 && currentBet * 2 <= playerBalance) ? buttonVariants.tap : undefined}
                                                    disabled={currentBet <= 0 || currentBet * 2 > playerBalance}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Double
                                                </motion.button>
                                            </motion.div>
                                        </motion.div>

                                        <motion.div
                                            className="flex items-center justify-end w-full gap-3 mt-4 sm:w-auto sm:mt-0"
                                            variants={childVariants}
                                        >
                                            <motion.div
                                                className="px-5 py-3 rounded-md border border-amber-800/50 bg-black/40 backdrop-blur-sm shadow-inner"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <span className="mr-2 text-sm text-amber-400/90">Current Bet:</span>
                                                <span className="text-lg font-bold text-amber-100">${currentBet}</span>
                                            </motion.div>

                                            <div className="flex flex-col gap-2">
                                                <motion.button
                                                    onClick={onDeal}
                                                    className={cn(
                                                        "px-8 py-3 rounded-lg text-base font-bold shadow-lg flex items-center",
                                                        "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white",
                                                        "border border-emerald-500/30",
                                                        "transition-all duration-200 ease-in-out",
                                                        currentBet <= 0 && "opacity-50 cursor-not-allowed",
                                                        currentBet > 0 && "animate-pulse"
                                                    )}
                                                    whileHover={currentBet > 0 ? buttonVariants.hover : buttonVariants.disabled}
                                                    whileTap={currentBet > 0 ? buttonVariants.tap : undefined}
                                                    disabled={currentBet <= 0}
                                                >
                                                    <BadgeDollarSign className="w-5 h-5 mr-2" />
                                                    Deal Cards
                                                </motion.button>
                                                <div className="flex gap-2">
                                                    {onEndGame && (
                                                        <motion.button
                                                            onClick={onEndGame}
                                                            className="px-3 py-1.5 text-xs rounded-md bg-red-900/80 hover:bg-red-800 text-white font-medium flex items-center"
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                        >
                                                            <Ban className="w-3.5 h-3.5 mr-1" />
                                                            End Game
                                                        </motion.button>
                                                    )}
                                                    {onResetGame && (
                                                        <motion.button
                                                            onClick={onResetGame}
                                                            className="px-3 py-1.5 text-xs rounded-md bg-blue-900/80 hover:bg-blue-800 text-white font-medium flex items-center"
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                                            Reset Game
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Action controls - shown during player turn */}
                                {gamePhase === 'player-turn' && (
                                    <motion.div
                                        key="player-turn"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
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
                                            className="bg-black/40 border border-amber-900/30 backdrop-blur-md shadow-lg"
                                        />
                                    </motion.div>
                                )}

                                {/* Dealer turn message */}
                                {gamePhase === 'dealer-turn' && (
                                    <motion.div
                                        key="dealer-turn"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="flex justify-center"
                                    >
                                        <motion.div
                                            className="px-8 py-4 text-center border rounded-md bg-black/40 backdrop-blur-sm border-amber-700/60 shadow-md"
                                            variants={childVariants}
                                        >
                                            <p className="text-xl font-medium text-amber-100">Dealer&apos;s Turn</p>
                                            <p className="text-sm text-amber-400/90">The dealer is playing their hand...</p>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Round over controls */}
                                {(gamePhase === 'payout' || gamePhase === 'game-over') && (
                                    <motion.div
                                        key="round-over"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="flex justify-center items-center gap-4"
                                    >
                                        <motion.button
                                            onClick={onNextRound}
                                            className="px-10 py-4 rounded-lg text-lg font-bold shadow-lg flex items-center justify-center
                                                      bg-gradient-to-br from-amber-600 to-amber-800 text-white
                                                      border border-amber-500/30 transition-all duration-200"
                                            whileHover={buttonVariants.hover}
                                            whileTap={buttonVariants.tap}
                                            variants={childVariants}
                                        >
                                            <RotateCcw className="w-5 h-5 mr-3" />
                                            Next Round
                                            <Sparkles className="w-4 h-4 ml-2 text-amber-300" />
                                        </motion.button>

                                        <div className="flex gap-3">
                                            {onEndGame && (
                                                <motion.button
                                                    onClick={onEndGame}
                                                    className="px-4 py-2 rounded-md bg-red-900/80 hover:bg-red-800 text-white font-medium flex items-center shadow-md"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    variants={childVariants}
                                                >
                                                    <Ban className="w-4 h-4 mr-2" />
                                                    End Game
                                                </motion.button>
                                            )}
                                            {onResetGame && (
                                                <motion.button
                                                    onClick={onResetGame}
                                                    className="px-4 py-2 rounded-md bg-blue-900/80 hover:bg-blue-800 text-white font-medium flex items-center shadow-md"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    variants={childVariants}
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Reset Game
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.footer>
                )}
            </AnimatePresence>
        </>
    );
};

export default GameFooter;