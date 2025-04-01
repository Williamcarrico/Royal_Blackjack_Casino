'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface HandValueProps {
    value: number;
    isSoft?: boolean;
    isBlackjack?: boolean;
    isBust?: boolean;
    isDealer?: boolean;
    className?: string;
}

const HandValue = ({
    value,
    isSoft = false,
    isBlackjack = false,
    isBust = false,
    isDealer = false,
    className = '',
}: HandValueProps) => {
    // Pre-calculate conditions
    const isPerfect = value === 21;
    const showBustText = value > 21;

    // Precalculate style classes
    const bgColors = {
        blackjack: 'bg-gradient-to-r from-yellow-500 to-amber-500 dark:from-yellow-600 dark:to-amber-600',
        bust: 'bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600',
        perfect: 'bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600',
        dealer: 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700',
        default: 'bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900'
    };

    const positionClasses = {
        dealer: 'absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3',
        player: 'absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3'
    };

    // Get background color
    const getBgColor = () => {
        if (isBlackjack) return bgColors.blackjack;
        if (isBust) return bgColors.bust;
        if (isPerfect) return bgColors.perfect;
        return isDealer ? bgColors.dealer : bgColors.default;
    };

    // Get position class
    const positionClass = isDealer ? positionClasses.dealer : positionClasses.player;

    // Get display text
    const getDisplayText = () => {
        if (isBlackjack) return 'Blackjack!';
        if (isBust) return 'Bust!';
        return `${isSoft ? 'Soft' : ''} ${value}`;
    };
    const displayText = getDisplayText();

    // Get secondary text
    const getSecondaryText = () => {
        if (showBustText) return 'Bust!';
        if (isPerfect) return 'Perfect!';
        if (isDealer) return 'Dealer';
        return '';
    };

    // Define animation
    const yOffset = isDealer ? -5 : 5;

    // Animation variants
    const valueVariants = {
        initial: { opacity: 0, y: yOffset, scale: 0.95 },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.3, type: 'spring', stiffness: 300 }
        },
        exit: {
            opacity: 0,
            y: -yOffset,
            scale: 0.95,
            transition: { duration: 0.2 }
        }
    };

    // Component key for animation
    const componentKey = `${value}-${isSoft ? 'soft' : 'hard'}-${isBlackjack ? 'bj' : ''}-${isBust ? 'bust' : ''}-${isDealer ? 'dealer' : 'player'}`;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={componentKey}
                variants={valueVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                    positionClass,
                    'px-3 py-1 rounded-full shadow-md z-10',
                    'text-center font-medium text-sm text-white',
                    getBgColor(),
                    isDealer && 'border border-white/20',
                    className
                )}
                aria-live="polite"
            >
                <span className="mr-1">{displayText}</span>

                {!isBlackjack && !isBust && (
                    <span className="text-xs opacity-70">{getSecondaryText()}</span>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default HandValue;