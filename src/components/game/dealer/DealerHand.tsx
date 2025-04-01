'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import Hand, { CardData } from '../hand/Hand';
import HandOutcome, { OutcomeType } from '../hand/HandOutcome';

export interface DealerHandProps {
    cards: CardData[];
    isActive?: boolean;
    gamePhase: 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
    outcome?: OutcomeType;
    score?: number;
    showScore?: boolean;
    showOutcome?: boolean;
    hideHoleCard?: boolean;
    className?: string;
    animate?: boolean;
    animateDealing?: boolean;
    showUpcard?: boolean;
}

const DealerHand = ({
    cards,
    isActive = false,
    gamePhase,
    outcome = null,
    score,
    showScore = true,
    showOutcome = true,
    hideHoleCard = false,
    className = '',
    animate = true,
    animateDealing = true,
    showUpcard = false,
}: DealerHandProps) => {
    // Automatically hide the hole card during certain game phases
    const shouldHideHoleCard = hideHoleCard ||
        ['dealing', 'player-turn'].includes(gamePhase);

    // Calculate if the score is soft (contains an ace counted as 11)
    const isSoft = cards.some(card => card.rank === 'A') &&
        score && score <= 21 && score - 10 > 0;

    // Extract the soft prefix to remove nested ternary
    const softPrefix = isSoft ? 'Soft ' : '';

    // Format the score for display
    const formattedScore = score !== undefined
        ? `${softPrefix}${score}`
        : '';

    // Only show the score in certain game phases
    const shouldShowScore = showScore && score !== undefined &&
        ['dealer-turn', 'payout', 'game-over'].includes(gamePhase);

    // Only show the first card explicitly when requested
    const upcardRank = cards.length > 0 ? cards[0]?.rank : '';

    // Animation for dealer's turn
    const dealerActiveVariants = {
        inactive: { scale: 1 },
        active: {
            scale: 1.05,
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* Main dealer hand */}
            <motion.div
                variants={dealerActiveVariants}
                initial="inactive"
                animate={isActive ? "active" : "inactive"}
                className="relative"
            >
                <Hand
                    cards={cards}
                    isDealer={true}
                    isActive={isActive}
                    isWinner={outcome === 'win' || outcome === 'blackjack'}
                    isLoser={outcome === 'lose' || outcome === 'bust'}
                    isPush={outcome === 'push'}
                    showValue={shouldShowScore}
                    hideSecondCard={shouldHideHoleCard}
                    animate={animateDealing && gamePhase === 'dealing'}
                    handType="dealer"
                    className="dealer-hand"
                />
            </motion.div>

            {/* Show upcard value when appropriate */}
            {showUpcard && upcardRank && shouldHideHoleCard && (
                <div className="absolute mt-1 transform -translate-x-1/2 translate-y-full -bottom-1 left-1/2">
                    <div className="text-white text-xs bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Upcard: {upcardRank}
                    </div>
                </div>
            )}

            {/* Display score when needed but not handled by Hand component */}
            {shouldShowScore && !shouldHideHoleCard && (
                <div className="absolute mt-1 transform -translate-x-1/2 translate-y-full -bottom-1 left-1/2">
                    <div className="text-white text-xs bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {formattedScore}
                    </div>
                </div>
            )}

            {/* Show dealer status during dealer's turn */}
            {isActive && gamePhase === 'dealer-turn' && (
                <div className="absolute mb-1 transform -translate-x-1/2 -translate-y-full -top-2 left-1/2">
                    <div className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">
                        Dealer&apos;s turn
                    </div>
                </div>
            )}

            {/* Show outcome at the end of the game */}
            {showOutcome && outcome && ['payout', 'game-over'].includes(gamePhase) && (
                <div className="absolute mb-1 transform -translate-x-1/2 -translate-y-full -top-2 left-1/2">
                    <HandOutcome
                        outcome={outcome}
                        size="sm"
                        animated={animate}
                        delay={0.5}
                    />
                </div>
            )}
        </div>
    );
};

export default DealerHand;