/**
 * BettingCircle Component
 *
 * Renders a circular betting area where chips can be placed. The component visualizes
 * bet amounts, handles bet removal, and displays win/loss animations.
 *
 * @component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Chip, { ChipValue } from './Chip';

/**
 * Generates position classes for stacked chips with proper layering
 *
 * @param {number} index - The index of the chip in the stack
 * @returns {string} CSS classes for positioning the chip
 */
const getChipPositionClasses = (index: number) => {
    return `absolute -translate-y-[${index * 2}px] z-[${10 + index}]`;
};

export interface BetInfo {
    amount: number;
    chips: Array<{
        value: ChipValue;
        count: number;
    }>;
}

export interface BettingCircleProps {
    betAmount?: number;
    placedChips?: Array<{
        value: ChipValue;
        count: number;
    }>;
    active?: boolean;
    disabled?: boolean;
    winner?: boolean;
    loser?: boolean;
    push?: boolean;
    payoutMultiplier?: number;
    label?: string;
    className?: string;
    onBetRemoved?: () => void;
    allowRemoval?: boolean;
    animate?: boolean;
    showPayoutAnimation?: boolean;
}

/**
 * BettingCircle component displays a circular area where players place bets
 * It supports various states including active, winner, loser, push
 * and animations for chip placement and win/loss outcomes
 */
const BettingCircle = ({
    betAmount = 0,
    placedChips = [],
    active = false,
    disabled = false,
    winner = false,
    loser = false,
    push = false,
    payoutMultiplier = 1,
    label = 'Bet',
    className = '',
    onBetRemoved,
    allowRemoval = true,
    animate = true,
    showPayoutAnimation = false,
}: BettingCircleProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showWinAnimation, setShowWinAnimation] = useState(false);

    // Process win animations
    useEffect(() => {
        if (winner && showPayoutAnimation && betAmount > 0) {
            setShowWinAnimation(true);

            // Reset the animation after it plays
            const timeout = setTimeout(() => {
                setShowWinAnimation(false);
            }, 2000);

            return () => clearTimeout(timeout);
        }

        return () => { }; // Empty cleanup function for other code paths
    }, [winner, showPayoutAnimation, betAmount]);

    // Determine circle styling based on state
    const circleStyle = (() => {
        if (winner) return 'ring-2 ring-green-500 bg-green-900/20';
        if (loser) return 'ring-2 ring-red-500 bg-red-900/20';
        if (push) return 'ring-2 ring-yellow-500 bg-yellow-900/20';
        if (active) return 'ring-2 ring-primary bg-primary/10';
        return 'ring-1 ring-white/30 bg-black/20';
    })();

    /**
     * Handles clicks on the betting circle with propagation prevention
     * Triggers bet removal when clicked if allowed
     *
     * @param {React.MouseEvent} e - The click event
     */
    const handleClick = (e: React.MouseEvent) => {
        // Prevent event propagation to parent elements
        e.stopPropagation();

        if (disabled) return;

        if (betAmount > 0 && allowRemoval) {
            onBetRemoved?.();
        }
    };

    /**
     * Handles keyboard interactions for accessibility
     * Allows Enter or Space to remove bet if allowed
     *
     * @param {React.KeyboardEvent} e - The keyboard event
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        // Prevent default browser behavior for these keys
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleClick(e as unknown as React.MouseEvent);
        }
    };

    return (
        <div className={cn('relative flex flex-col items-center z-30', className)}>
            {/* Betting circle with improved responsive sizing */}
            <motion.div
                className={cn(
                    'relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center',
                    'transition-all duration-200',
                    circleStyle,
                    !disabled && betAmount > 0 && allowRemoval && 'cursor-pointer',
                    active && 'ring-4 ring-primary shadow-lg shadow-primary/20',
                    disabled && 'opacity-50'
                )}
                whileHover={!disabled && betAmount > 0 && allowRemoval ? { scale: 1.05 } : undefined}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                tabIndex={!disabled && betAmount > 0 && allowRemoval ? 0 : -1}
                onKeyDown={handleKeyDown}
                role={!disabled && betAmount > 0 && allowRemoval ? 'button' : undefined}
                aria-label={`${label} area with ${betAmount} bet`}
                aria-disabled={disabled}
            >
                {/* Inner circle */}
                <div className="absolute border rounded-full inset-1 border-white/20" />

                {/* Label when no bet is placed */}
                {betAmount === 0 && (
                    <div className="text-sm font-medium text-white/70">{label}</div>
                )}

                {/* Chips display */}
                {betAmount > 0 && (
                    <div className="relative flex items-center justify-center">
                        {placedChips.map((chipInfo, index) => (
                            <div
                                key={`${chipInfo.value}-${index}`}
                                className={getChipPositionClasses(index)}
                            >
                                <Chip
                                    value={chipInfo.value}
                                    count={chipInfo.count}
                                    stacked
                                    size="md"
                                    appearWithAnimation={animate}
                                    index={index}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Removal indicator when hovering */}
                {!disabled && isHovered && betAmount > 0 && allowRemoval && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-full bg-black/40">
                        <span className="text-xs font-medium text-white">Remove</span>
                    </div>
                )}

                {/* Win animation */}
                <AnimatePresence>
                    {showWinAnimation && (
                        <>
                            {/* Payout multiplier text */}
                            <motion.div
                                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                animate={{ opacity: 1, y: -40, scale: 1 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.5, type: 'spring' }}
                                className="absolute z-50 text-xl font-bold text-green-400"
                            >
                                {payoutMultiplier !== 1 ? `×${payoutMultiplier}` : '+'}
                            </motion.div>

                            {/* Animated rings */}
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={`win-animation-ring-${i}-${payoutMultiplier}`}
                                    className="absolute inset-0 border-2 border-green-400 rounded-full"
                                    initial={{ opacity: 0.7, scale: 1 }}
                                    animate={{ opacity: 0, scale: 2 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: 1,
                                        delay: i * 0.2,
                                        repeat: 1,
                                        repeatType: 'loop'
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bet amount display with responsive sizing */}
            {betAmount > 0 && (
                <div className="px-2 py-1 mt-2 text-xs sm:text-sm font-medium text-white rounded bg-black/40">
                    ${betAmount.toLocaleString()}
                </div>
            )}
        </div>
    );
};

export default BettingCircle;