'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData } from '../hand/Hand';

export interface DealerActionsProps {
    isActive: boolean;
    gamePhase: 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
    dealerCards: CardData[];
    dealerScore: number;
    lastAction?: 'hit' | 'stand' | 'reveal' | null;
    showActions?: boolean;
    className?: string;
}

const DealerActions = ({
    isActive,
    gamePhase,
    dealerCards,
    dealerScore,
    lastAction = null,
    showActions = true,
    className = '',
}: DealerActionsProps) => {
    // Only show actions during dealer turn
    const shouldShow = showActions && isActive && gamePhase === 'dealer-turn';

    if (!shouldShow) {
        return null;
    }

    // Determine if the dealer busts
    const isBust = dealerScore > 21;

    // Determine dealer's strategy based on score
    const determineStrategy = () => {
        if (isBust) {
            return 'Dealer busts with ' + dealerScore;
        }

        if (dealerScore >= 17) {
            return 'Dealer must stand on 17 or higher';
        }

        if (dealerScore <= 16) {
            return 'Dealer must hit on 16 or lower';
        }

        return '';
    };

    const strategy = determineStrategy();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                staggerChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 10 }
    };

    // Last action text and color
    const getActionText = () => {
        if (lastAction === 'reveal') {
            return 'Dealer reveals hole card';
        } else if (lastAction === 'hit') {
            return 'Dealer hits';
        } else if (lastAction === 'stand') {
            return 'Dealer stands';
        }
        return '';
    };

    const actionText = getActionText();
    const actionColor =
        lastAction === 'hit' ? 'text-red-500' :
            lastAction === 'stand' ? 'text-green-500' :
                'text-blue-500';

    return (
        <AnimatePresence mode="wait">
            {shouldShow && (
                <motion.div
                    className={cn(
                        'bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white shadow-lg',
                        className
                    )}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Dealer strategy */}
                    <motion.div
                        className="mb-2 text-sm font-medium"
                        variants={itemVariants}
                    >
                        {strategy}
                    </motion.div>

                    {/* Last action taken */}
                    {actionText && (
                        <motion.div
                            className={cn("text-lg font-bold", actionColor)}
                            variants={itemVariants}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15
                                }
                            }}
                        >
                            {actionText}
                        </motion.div>
                    )}

                    {/* Current hand summary */}
                    <motion.div
                        className="mt-1 text-xs text-gray-300"
                        variants={itemVariants}
                    >
                        Cards: {dealerCards.length} | Score: {dealerScore}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DealerActions;