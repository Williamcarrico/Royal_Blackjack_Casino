'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import DealerHand from './DealerHand';
import { CardData } from '../hand/Hand';
import { OutcomeType } from '../hand/HandOutcome';
import MessageDisplay from '../status/MessageDisplay';

export interface DealerTurnProps {
    cards: CardData[];
    isActive: boolean;
    gamePhase: 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
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
    const [currentStep, setCurrentStep] = useState<'initial' | 'reveal' | 'draw' | 'stand'>('initial');
    const [thinking, setThinking] = useState(false);
    const [message, setMessage] = useState('');
    const [actionTimer, setActionTimer] = useState<NodeJS.Timeout | null>(null);

    // Calculate dealer score
    const calculateScore = (cards: CardData[]): number => {
        let total = 0;
        let aces = 0;

        for (const card of cards) {
            const rank = card.rank;
            if (rank === 'A') {
                aces += 1;
                total += 1;
            } else if (['K', 'Q', 'J'].includes(rank)) {
                total += 10;
            } else {
                total += parseInt(rank, 10);
            }
        }

        // Optimize aces
        while (aces > 0 && total + 10 <= 21) {
            total += 10;
            aces -= 1;
        }

        return total;
    };

    // Get the current dealer score
    const score = dealerScore ?? calculateScore(cards);

    // Determine if the dealer busts
    const isBust = score > 21;

    // Reset state when dealer turn starts
    useEffect(() => {
        if (isActive && gamePhase === 'dealer-turn') {
            setCurrentStep('initial');
            setThinking(true);
            setMessage('Dealer\'s turn');

            // Start dealer turn sequence
            if (autoPlay) {
                const timer = setTimeout(() => {
                    setCurrentStep('reveal');
                }, flipDelay);

                setActionTimer(timer);
                return () => clearTimeout(timer);
            }
        }
        return undefined;
    }, [isActive, gamePhase, autoPlay, flipDelay]);

    // Handle hole card reveal
    useEffect(() => {
        if (currentStep === 'reveal' && isActive && gamePhase === 'dealer-turn') {
            setMessage('Revealing hole card...');

            if (autoPlay) {
                const timer = setTimeout(() => {
                    setMessage(score >= standValue ? `Dealer stands with ${score}` : `Dealer has ${score}`);
                    setThinking(false);

                    // Determine next action
                    if (score >= standValue || isBust) {
                        setCurrentStep('stand');
                    } else {
                        setCurrentStep('draw');
                    }
                }, drawDelay);

                setActionTimer(timer);
                return () => clearTimeout(timer);
            }
        }
        return undefined;
    }, [currentStep, isActive, gamePhase, score, standValue, isBust, autoPlay, drawDelay]);

    // Handle drawing cards
    useEffect(() => {
        if (currentStep === 'draw' && isActive && gamePhase === 'dealer-turn') {
            setThinking(true);
            setMessage(`Dealer draws a card...`);

            if (autoPlay) {
                const timer = setTimeout(() => {
                    // Signal to parent that dealer wants to hit
                    onDealerAction?.('hit', score);

                    // After drawing, check score again
                    setThinking(false);

                    // This will be updated when new cards are received
                }, drawDelay);

                setActionTimer(timer);
                return () => clearTimeout(timer);
            }
        }
        return undefined;
    }, [currentStep, isActive, gamePhase, score, onDealerAction, autoPlay, drawDelay]);

    // Handle dealer standing
    useEffect(() => {
        if (currentStep === 'stand' && isActive && gamePhase === 'dealer-turn') {
            setThinking(false);

            let dealerOutcome: OutcomeType = null;
            if (isBust) {
                dealerOutcome = 'bust';
                setMessage('Dealer busts!');
            } else {
                dealerOutcome = null;
                setMessage(`Dealer stands with ${score}`);
            }

            if (autoPlay) {
                const timer = setTimeout(() => {
                    // Signal to parent that dealer is done
                    onDealerAction?.('stand', score);
                    onDealerTurnEnd?.(score, dealerOutcome);
                }, drawDelay);

                setActionTimer(timer);
                return () => clearTimeout(timer);
            }

            return undefined;
        }
        return undefined;
    }, [currentStep, isActive, gamePhase, score, isBust, onDealerAction, onDealerTurnEnd, autoPlay, drawDelay]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (actionTimer) {
                clearTimeout(actionTimer);
            }
        };
    }, [actionTimer]);

    // Reset when dealer gets new cards
    useEffect(() => {
        if (currentStep === 'draw' && isActive && gamePhase === 'dealer-turn') {
            // After drawing, check if we need to draw again or stand
            if (score >= standValue || isBust) {
                setCurrentStep('stand');
            } else {
                // Continue drawing
                setCurrentStep('draw');
            }
        }
        return undefined;
    }, [cards.length, currentStep, isActive, gamePhase, score, standValue, isBust]);

    return (
        <div className={cn('relative', className)}>
            {/* Dealer hand display */}
            <DealerHand
                cards={cards}
                isActive={isActive}
                gamePhase={gamePhase}
                outcome={outcome}
                score={score}
                hideHoleCard={currentStep === 'initial'}
                showUpcard={true}
            />

            {/* Thinking indicator */}
            <AnimatePresence>
                {showThinking && thinking && isActive && gamePhase === 'dealer-turn' && (
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
                {message && isActive && gamePhase === 'dealer-turn' && (
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