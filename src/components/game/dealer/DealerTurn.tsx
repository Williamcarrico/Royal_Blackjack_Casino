'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import DealerHand from './DealerHand';
import type { CardData } from '../hand/Hand';
import type { OutcomeType } from '@types/uiTypes';
import { UIGamePhase } from '@types/gameTypes';
import MessageDisplay from '../status/MessageDisplay';
import { useDealerTurn } from '@/hooks/useDealerTurn';

export interface DealerTurnProps {
    cards: CardData[];
    isActive: boolean;
    gamePhase: UIGamePhase;
    outcome?: OutcomeType;
    standValue?: number;
    dealerScore?: number;
    drawDelay?: number;
    flipDelay?: number;
    showThinking?: boolean;
    className?: string;
    onDealerAction?: (action: 'hit' | 'stand', score: number) => void;
    onDealerTurnEnd?: (finalScore: number, outcome: OutcomeType) => void;
    autoPlay?: boolean;
}

const DealerTurn = ({
    cards,
    isActive,
    gamePhase,
    outcome,
    standValue = 17,
    dealerScore,
    drawDelay = 1000,
    flipDelay = 500,
    showThinking = true,
    className = '',
    onDealerAction,
    onDealerTurnEnd,
    autoPlay = true,
}: DealerTurnProps) => {
    // Use the dealer turn hook to manage the dealer's actions
    const {
        currentCards,
        currentScore,
        isThinking,
        message,
        isDealerTurnComplete,
        lastAction,
        isBust
    } = useDealerTurn({
        cards,
        gamePhase,
        isActive,
        standValue,
        drawDelay,
        flipDelay,
        autoPlay,
        onDealerAction,
        onDealerTurnEnd
    });

    return (
        <div className={cn('relative', className)}>
            {/* Dealer hand display */}
            <DealerHand
                cards={currentCards}
                isActive={isActive}
                gamePhase={gamePhase}
                outcome={outcome}
                score={currentScore}
                hideHoleCard={!isActive || gamePhase !== UIGamePhase.DealerTurn}
                showUpcard={true}
            />

            {/* Thinking indicator */}
            <AnimatePresence>
                {showThinking && isThinking && isActive && gamePhase === UIGamePhase.DealerTurn && (
                    <motion.div
                        className="absolute top-0 transform -translate-x-1/2 -translate-y-full left-1/2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="flex items-center justify-center mt-2 space-x-1">
                            {['first', 'second', 'third'].map((position, i) => (
                                <motion.div
                                    key={`thinking-dot-${position}`}
                                    className="w-2 h-2 bg-white rounded-full"
                                    animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dealer message */}
            <AnimatePresence>
                {message && isActive && gamePhase === UIGamePhase.DealerTurn && (
                    <motion.div
                        className="absolute bottom-0 transform -translate-x-1/2 translate-y-full left-1/2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <MessageDisplay
                            message={message}
                            type={isBust ? 'error' : 'info'}
                            size="sm"
                            className="mt-2"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DealerTurn;