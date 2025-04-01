'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type OutcomeType = 'win' | 'lose' | 'push' | 'blackjack' | 'bust' | 'insurance' | 'surrender' | null;

export interface HandOutcomeProps {
    outcome: OutcomeType;
    amount?: number;
    showAmount?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
    delay?: number;
    showIcon?: boolean;
}

const HandOutcome = ({
    outcome,
    amount = 0,
    showAmount = true,
    className = '',
    size = 'md',
    animated = true,
    delay = 0,
    showIcon = true,
}: HandOutcomeProps) => {
    if (!outcome) return null;

    // Define styling based on outcome
    const getOutcomeStyle = () => {
        switch (outcome) {
            case 'win':
                return 'bg-green-600 text-white';
            case 'blackjack':
                return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white';
            case 'lose':
                return 'bg-red-600 text-white';
            case 'bust':
                return 'bg-red-700 text-white';
            case 'push':
                return 'bg-yellow-600 text-white';
            case 'insurance':
                return 'bg-blue-600 text-white';
            case 'surrender':
                return 'bg-gray-600 text-white';
            default:
                return 'bg-gray-700 text-white';
        }
    };

    // Get outcome text
    const getOutcomeText = () => {
        switch (outcome) {
            case 'win':
                return 'Win';
            case 'blackjack':
                return 'Blackjack!';
            case 'lose':
                return 'Lose';
            case 'bust':
                return 'Bust!';
            case 'push':
                return 'Push';
            case 'insurance':
                return 'Insurance Paid';
            case 'surrender':
                return 'Surrendered';
            default:
                return '';
        }
    };

    // Get icon based on outcome
    const getOutcomeIcon = () => {
        switch (outcome) {
            case 'win':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'blackjack':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
            case 'lose':
            case 'bust':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'push':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                );
            case 'insurance':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            case 'surrender':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Get size classes
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'px-2 py-0.5 text-xs';
            case 'lg':
                return 'px-4 py-2 text-base';
            case 'md':
            default:
                return 'px-3 py-1 text-sm';
        }
    };

    // Define animation variants
    const outcomeVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.8 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 500,
                damping: 20,
                delay: delay,
            },
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.8,
            transition: { duration: 0.2 },
        },
    };

    return (
        <AnimatePresence mode="wait">
            {outcome && (
                <motion.div
                    key={outcome}
                    className={cn(
                        'rounded-full shadow-md',
                        'font-medium whitespace-nowrap',
                        'flex items-center justify-center',
                        'z-10',
                        getOutcomeStyle(),
                        getSizeClasses(),
                        className
                    )}
                    variants={outcomeVariants}
                    initial={animated ? 'hidden' : false}
                    animate="visible"
                    exit="exit"
                    aria-label={`Hand result: ${getOutcomeText()}`}
                >
                    <output className="flex items-center justify-center">
                        {showIcon && (
                            <span className="mr-1">{getOutcomeIcon()}</span>
                        )}
                        <span>{getOutcomeText()}</span>
                        {showAmount && amount !== 0 && (
                            <output className="ml-1">
                                {amount > 0 ? `+$${amount}` : `-$${Math.abs(amount)}`}
                            </output>
                        )}
                    </output>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HandOutcome;