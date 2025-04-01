'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import Hand, { CardData } from '../hand/Hand';

export interface DealerPositionProps {
    cards: CardData[];
    isActive?: boolean;
    gamePhase: 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
    result?: 'win' | 'lose' | 'push';
    className?: string;
}

const DealerPosition = ({
    cards,
    isActive = false,
    gamePhase,
    result,
    className = '',
}: DealerPositionProps) => {
    // Hide the dealer's second card (hole card) during player's turn
    const hideSecondCard = gamePhase === 'dealing' || gamePhase === 'player-turn';

    // Determine if the dealer hand is in a winning or losing state
    const isWinner = result === 'win';
    const isLoser = result === 'lose';
    const isPush = result === 'push';

    // Get dealer result text for display
    const getDealerResultText = () => {
        if (isWinner) return 'Dealer wins';
        if (isLoser) return 'Dealer busts';
        return 'Push';
    };

    // Get background color based on result
    const getResultBackground = () => {
        if (isWinner) return 'bg-green-600';
        if (isLoser) return 'bg-red-600';
        return 'bg-yellow-600';
    };

    // Animation for dealer label
    const dealerLabelVariants = {
        initial: { opacity: 0, y: -10 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.3,
                duration: 0.5
            }
        }
    };

    return (
        <motion.div
            className={cn(
                'flex flex-col items-center gap-2',
                isActive && 'scale-105',
                className
            )}
            animate={isActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Dealer label */}
            <motion.div
                className="mb-1 text-sm font-medium text-white"
                initial="initial"
                animate="animate"
                variants={dealerLabelVariants}
            >
                Dealer
            </motion.div>

            {/* Dealer's hand */}
            <div className="relative">
                <Hand
                    cards={cards}
                    isDealer={true}
                    isActive={isActive}
                    isWinner={isWinner}
                    isLoser={isLoser}
                    isPush={isPush}
                    showValue={!hideSecondCard}
                    hideSecondCard={hideSecondCard}
                    animate={gamePhase === 'dealing'}
                    handType="dealer"
                />

                {/* Dealer status indicator */}
                {gamePhase === 'dealer-turn' && cards.length > 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                        Dealer&apos;s turn
                    </div>
                )}

                {/* Result indicator */}
                {gamePhase === 'payout' && result && (
                    <div
                        className={cn(
                            'absolute -top-2 left-1/2 transform -translate-x-1/2 text-white text-xs px-2 py-0.5 rounded-full',
                            getResultBackground()
                        )}
                    >
                        {getDealerResultText()}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DealerPosition;